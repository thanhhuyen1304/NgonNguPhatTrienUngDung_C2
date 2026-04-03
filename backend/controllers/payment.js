const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const https = require('https');
const Order = require('../schemas/Order');
const Cart = require('../schemas/Cart');
const Product = require('../schemas/Product');

/* ============================================================
   Helper: Tạo chữ ký HMAC SHA256 cho MoMo
============================================================ */
const createMomoSignature = (rawSignature, secretKey) => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
};

/* ============================================================
   Helper: Gọi MoMo API bằng https thuần (không cần axios)
============================================================ */
const callMomoAPI = (data) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'test-payment.momo.vn',
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(new Error('Invalid JSON from MoMo: ' + responseData));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

const finalizeMomoPayment = async ({ order, resultCode, transactionId, momoOrderId, actor }) => {
  if (String(resultCode) !== '0') {
    if (order.paymentStatus === 'pending') {
      order.paymentStatus = 'failed';
      order.paymentDetails = {
        ...order.paymentDetails,
        momoOrderId: order.paymentDetails?.momoOrderId || momoOrderId || null,
        lastResultCode: String(resultCode),
        ...(actor === 'ipn' ? { lastWebhookAt: new Date() } : { lastVerifiedAt: new Date() }),
      };
      await order.save();
    }

    return order;
  }

  if (order.paymentStatus === 'paid' && order.stockCommitted) {
    order.paymentDetails = {
      ...order.paymentDetails,
      momoOrderId: order.paymentDetails?.momoOrderId || momoOrderId || null,
      transactionId: transactionId || order.paymentDetails?.transactionId || null,
      lastResultCode: '0',
      ...(actor === 'ipn' ? { lastWebhookAt: new Date() } : { lastVerifiedAt: new Date() }),
    };
    await order.save();
    return order;
  }

  const session = await Order.startSession();

  try {
    await session.withTransaction(async () => {
      const lockedOrder = await Order.findById(order._id).session(session);

      if (!lockedOrder) {
        throw new Error('Order not found');
      }

      if (lockedOrder.paymentStatus === 'paid' && lockedOrder.stockCommitted) {
        return;
      }

      for (const item of lockedOrder.items) {
        const stockResult = await Product.updateOne(
          {
            _id: item.product,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity, sold: item.quantity },
          },
          { session }
        );

        if (!stockResult.modifiedCount) {
          throw new Error(`Not enough stock for ${item.name}`);
        }
      }

      lockedOrder.paymentStatus = 'paid';
      lockedOrder.stockCommitted = true;
      lockedOrder.paymentDetails = {
        ...lockedOrder.paymentDetails,
        momoOrderId: lockedOrder.paymentDetails?.momoOrderId || momoOrderId || null,
        transactionId: transactionId || lockedOrder.paymentDetails?.transactionId || null,
        paidAt: new Date(),
        lastResultCode: '0',
        ...(actor === 'ipn' ? { lastWebhookAt: new Date() } : { lastVerifiedAt: new Date() }),
      };

      await lockedOrder.save({ session });
      await Cart.findOneAndUpdate(
        { user: lockedOrder.user },
        { items: [], totalItems: 0, totalPrice: 0 },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return Order.findById(order._id);
};

/* ============================================================
   @desc    Tạo order + payment link MoMo
   @route   POST /api/payment/momo/create
   @access  Private
============================================================ */
const createMomoPayment = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, note, checkoutRequestKey } = req.body;

  if (paymentMethod !== 'momo') {
    res.status(400);
    throw new Error('Payment method must be momo');
  }

  // ── 1. Lấy giỏ hàng ────────────────────────────────────────
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name price images stock isActive',
  });

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  if (checkoutRequestKey) {
    const existingOrder = await Order.findOne({
      user: req.user._id,
      checkoutRequestKey,
    });

    if (existingOrder && existingOrder.paymentMethod === 'momo') {
      return res.status(200).json({
        success: true,
        data: {
          payUrl: null,
          orderId: existingOrder._id,
          momoOrderId: existingOrder.paymentDetails?.momoOrderId || null,
        },
      });
    }
  }

  // ── 2. Validate sản phẩm & stock ───────────────────────────
  const orderItems = [];
  for (const item of cart.items) {
    if (!item.product || !item.product.isActive) {
      res.status(400);
      throw new Error(`Sản phẩm "${item.product?.name || 'Unknown'}" không còn kinh doanh`);
    }
    if (item.product.stock < item.quantity) {
      res.status(400);
      throw new Error(
        `Không đủ hàng cho "${item.product.name}". Còn: ${item.product.stock}`
      );
    }
    orderItems.push({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images[0]?.url || '',
      price: item.product.price,
      quantity: item.quantity,
    });

    // ⚠️ KHÔNG trừ stock ở đây — chỉ trừ sau khi MoMo xác nhận thanh toán thành công
  }

  // ── 3. Tạo Order trong DB (paymentStatus = pending) ─────────
  const order = new Order({
    user: req.user._id,
    items: orderItems,
    shippingAddress: {
      ...shippingAddress,
      latitude: shippingAddress.latitude,
      longitude: shippingAddress.longitude,
    },
    paymentMethod: 'momo',
    paymentStatus: 'pending',
    checkoutRequestKey: checkoutRequestKey || null,
    note,
  });
  order.calculatePrices();
  order.statusHistory.push({
    status: 'pending',
    note: 'Order placed - awaiting MoMo payment',
    updatedAt: new Date(),
  });
  await order.save();

  // ⚠️ KHÔNG xóa giỏ hàng ở đây — chỉ xóa sau khi thanh toán thành công

  // ── 4. Tạo MoMo payment request ────────────────────────────
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey   = process.env.MOMO_ACCESS_KEY;
  const secretKey   = process.env.MOMO_SECRET_KEY;
  const redirectUrl = process.env.MOMO_REDIRECT_URL;
  const ipnUrl      = process.env.MOMO_IPN_URL;

  if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl) {
    res.status(500);
    throw new Error('MoMo payment is not configured on the server');
  }

  const orderId      = `${order._id}-${Date.now()}`;
  const requestId    = `${partnerCode}-${Date.now()}`;
  const amount       = order.totalPrice;         // VND, số nguyên
  const orderInfo    = `Thanh toán đơn hàng ${order.orderNumber}`;
  const requestType  = 'payWithMethod';
  const extraData    = Buffer.from(JSON.stringify({ orderId: order._id.toString() })).toString('base64');
  const lang         = 'vi';
  const autoCapture  = true;

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = createMomoSignature(rawSignature, secretKey);

  const momoPayload = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang,
    autoCapture,
  };

  // ── 5. Gọi MoMo API ────────────────────────────────────────
  let momoResponse;
  try {
    momoResponse = await callMomoAPI(momoPayload);
  } catch (err) {
    console.error('❌ MoMo API error:', err.message);
    res.status(502);
    throw new Error('Không thể kết nối tới MoMo. Vui lòng thử lại.');
  }

  if (momoResponse.resultCode !== 0) {
    console.error('❌ MoMo rejected:', momoResponse);
    res.status(400);
    throw new Error(`MoMo error: ${momoResponse.message}`);
  }

  // Lưu MoMo orderId vào order để dùng khi verify
  order.paymentDetails = {
    momoOrderId: orderId,
    transactionId: null,
  };
  await order.save();

  res.status(201).json({
    success: true,
    data: {
      payUrl: momoResponse.payUrl,
      orderId: order._id,            // MongoDB order _id để FE điều hướng sau
      momoOrderId: orderId,          // MoMo orderId để verify
    },
  });
});

/* ============================================================
   @desc    IPN callback từ MoMo (MoMo gọi về khi thanh toán xong)
            Local: MoMo không gọi được, nhưng vẫn để route sẵn
   @route   POST /api/payment/momo/ipn
   @access  Public (MoMo server)
============================================================ */
const momoIPN = asyncHandler(async (req, res) => {
  console.log('📬 MoMo IPN received:', req.body);

  const {
    partnerCode, orderId, requestId, amount,
    orderInfo, orderType, transId, resultCode,
    message, payType, responseTime, extraData, signature,
  } = req.body;

  // Verify chữ ký
  const secretKey = process.env.MOMO_SECRET_KEY;
  const accessKey = process.env.MOMO_ACCESS_KEY;

  if (!secretKey || !accessKey) {
    return res.status(500).json({ message: 'MoMo payment is not configured on the server' });
  }

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&message=${message}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&orderType=${orderType}` +
    `&partnerCode=${partnerCode}` +
    `&payType=${payType}` +
    `&requestId=${requestId}` +
    `&responseTime=${responseTime}` +
    `&resultCode=${resultCode}` +
    `&transId=${transId}`;

  const expectedSignature = createMomoSignature(rawSignature, secretKey);

  if (signature !== expectedSignature) {
    console.error('❌ MoMo IPN signature mismatch');
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const order = await Order.findOne({
    $or: [
      { 'paymentDetails.momoOrderId': orderId },
      { 'paymentDetails.transactionId': orderId },
    ],
  });

  if (!order) {
    console.error('❌ MoMo IPN: Order not found for orderId:', orderId);
    return res.status(404).json({ message: 'Order not found' });
  }

  await finalizeMomoPayment({
    order,
    resultCode,
    transactionId: transId?.toString() || null,
    momoOrderId: orderId,
    actor: 'ipn',
  });

  // MoMo yêu cầu response 200
  res.status(200).json({ message: 'IPN received' });
});

/* ============================================================
   @desc    Frontend gọi để xác nhận kết quả sau redirect
   @route   GET /api/payment/momo/verify?momoOrderId=...
   @access  Private
============================================================ */
const verifyMomoPayment = asyncHandler(async (req, res) => {
  const { momoOrderId } = req.query;

  if (!momoOrderId) {
    res.status(400);
    throw new Error('momoOrderId is required');
  }

  // Tìm order theo MoMo orderId
  const order = await Order.findOne({
    $or: [
      { 'paymentDetails.momoOrderId': momoOrderId },
      { 'paymentDetails.transactionId': momoOrderId },
    ],
    user: req.user._id,
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Nếu IPN đã update rồi thì trả về luôn
  if (order.paymentStatus === 'paid') {
    return res.json({
      success: true,
      data: { order, paymentStatus: 'paid' },
    });
  }

  // ── Gọi MoMo Query API để kiểm tra trạng thái ──────────────
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey   = process.env.MOMO_ACCESS_KEY;
  const secretKey   = process.env.MOMO_SECRET_KEY;
  const requestId   = `verify-${Date.now()}`;
  const lang        = 'vi';

  if (!partnerCode || !accessKey || !secretKey) {
    res.status(500);
    throw new Error('MoMo payment is not configured on the server');
  }

  const rawSignature =
    `accessKey=${accessKey}` +
    `&orderId=${momoOrderId}` +
    `&partnerCode=${partnerCode}` +
    `&requestId=${requestId}`;

  const signature = createMomoSignature(rawSignature, secretKey);

  const queryPayload = {
    partnerCode,
    requestId,
    orderId: momoOrderId,
    signature,
    lang,
  };

  let queryResult;
  try {
    queryResult = await new Promise((resolve, reject) => {
      const body = JSON.stringify(queryPayload);
      const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/query',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const req = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch (err) {
    console.error('❌ MoMo query error:', err.message);
    // Nếu query thất bại, vẫn trả về order hiện tại
    return res.json({
      success: true,
      data: { order, paymentStatus: order.paymentStatus },
    });
  }

  const finalOrder = await finalizeMomoPayment({
    order,
    resultCode: queryResult.resultCode,
    transactionId: queryResult.transId?.toString() || null,
    momoOrderId,
    actor: 'verify',
  });

  res.json({
    success: true,
    data: {
      order: finalOrder,
      paymentStatus: finalOrder.paymentStatus,
      momoResultCode: queryResult.resultCode,
      momoMessage: queryResult.message,
    },
  });
});

module.exports = {
  createMomoPayment,
  momoIPN,
  verifyMomoPayment,
};
