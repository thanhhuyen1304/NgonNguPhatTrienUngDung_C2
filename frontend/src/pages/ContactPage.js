import React, { useState } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send this data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Liên hệ với chúng tôi</h1>
          <p className="text-xl text-gray-600">
            Nếu bạn có câu hỏi hoặc góp ý, hãy gửi cho chúng tôi.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {/* Email Card */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <EnvelopeIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600">
              <a href="mailto:support@ecommerce.com" className="text-blue-600 hover:text-blue-700">
                support@ecommerce.com
              </a>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Chúng tôi sẽ phản hồi trong vòng 24 giờ
            </p>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <PhoneIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Điện thoại</h3>
            <p className="text-gray-600">
              <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-700">
                +1 (234) 567-890
              </a>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Thứ 2 - Thứ 6, 9:00 - 18:00
            </p>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <MapPinIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Địa chỉ</h3>
            <p className="text-gray-600">
              123 Đường Chính<br />
              Quận Trung tâm, TP.HCM
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Ghé thăm cửa hàng của chúng tôi
            </p>
          </div>

          {/* Hours Card */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Giờ làm việc</h3>
            <div className="text-gray-600 text-sm">
              <p>Thứ 2 - Thứ 6: 9:00 - 18:00</p>
              <p>Thứ 7: 10:00 - 16:00</p>
              <p>Chủ nhật: Nghỉ</p>
            </div>
          </div>
        </div>

        {/* Contact Form and Map */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Gửi tin nhắn cho chúng tôi
            </h2>

            {submitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  ✓ Cảm ơn bạn đã gửi tin nhắn! Chúng tôi sẽ phản hồi sớm nhất có thể.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nhập họ và tên"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="tenban@email.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Chủ đề *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Bạn muốn liên hệ về vấn đề gì?"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Nhập nội dung của bạn..."
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Gửi tin nhắn
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-6 text-center">
              * Trường bắt buộc
            </p>
          </div>

          {/* FAQ or Additional Info */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-md p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Câu hỏi thường gặp</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Thời gian giao hàng mất bao lâu?</h3>
                <p className="text-blue-100">
                  Giao hàng tiêu chuẩn thường mất 5-7 ngày làm việc. Giao hàng nhanh có thể từ 2-3 ngày làm việc.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Chính sách đổi trả như thế nào?</h3>
                <p className="text-blue-100">
                  Chúng tôi hỗ trợ đổi trả trong vòng 30 ngày với hầu hết sản phẩm. Sản phẩm cần còn nguyên trạng và bao bì gốc.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Có hỗ trợ giao hàng quốc tế không?</h3>
                <p className="text-blue-100">
                  Có. Chúng tôi hỗ trợ giao đến nhiều quốc gia và phí vận chuyển phụ thuộc vào khu vực nhận hàng.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Làm thế nào để theo dõi đơn hàng?</h3>
                <p className="text-blue-100">
                  Khi đơn hàng được gửi đi, bạn sẽ nhận được mã theo dõi qua email và có thể xem lại bất cứ lúc nào trong tài khoản của mình.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Có hỗ trợ khách hàng không?</h3>
                <p className="text-blue-100">
                  Có. Đội ngũ hỗ trợ của chúng tôi hoạt động từ thứ 2 đến thứ 6, từ 9:00 đến 18:00 qua email, điện thoại hoặc chat trực tiếp.
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-500 bg-opacity-30 rounded-lg border border-blue-400">
              <p className="text-sm">
                 <strong>Cần hỗ trợ gấp?</strong><br />
                 Hãy liên hệ qua email hoặc điện thoại trong giờ làm việc để được hỗ trợ nhanh nhất.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
