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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-600">
            Have a question or feedback? We'd love to hear from you.
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
              We'll respond within 24 hours
            </p>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <PhoneIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600">
              <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-700">
                +1 (234) 567-890
              </a>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Mon-Fri, 9AM-6PM EST
            </p>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <MapPinIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
            <p className="text-gray-600">
              123 Main Street<br />
              New York, NY 10001
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Visit our showroom
            </p>
          </div>

          {/* Hours Card */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Hours</h3>
            <div className="text-gray-600 text-sm">
              <p>Mon-Fri: 9AM - 6PM</p>
              <p>Sat: 10AM - 4PM</p>
              <p>Sun: Closed</p>
            </div>
          </div>
        </div>

        {/* Contact Form and Map */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Send us a Message
            </h2>

            {submitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  ✓ Thank you for your message! We'll get back to you soon.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Your name"
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
                  placeholder="your@email.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Your phone number"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="What is this about?"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Your message here..."
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-6 text-center">
              * Required fields
            </p>
          </div>

          {/* FAQ or Additional Info */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-md p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">How long does shipping take?</h3>
                <p className="text-blue-100">
                  Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What is your return policy?</h3>
                <p className="text-blue-100">
                  We offer 30-day returns on most items. Items must be unused and in original packaging.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Do you offer international shipping?</h3>
                <p className="text-blue-100">
                  Yes, we ship to most countries worldwide. International shipping rates vary by location.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How can I track my order?</h3>
                <p className="text-blue-100">
                  Once your order ships, you'll receive a tracking number via email. You can track it anytime in your account.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Do you offer customer support?</h3>
                <p className="text-blue-100">
                  Yes! Our support team is available Monday-Friday, 9AM-6PM EST via email, phone, or live chat.
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-500 bg-opacity-30 rounded-lg border border-blue-400">
              <p className="text-sm">
                <strong>Need help urgently?</strong><br />
                Contact us via email or phone during business hours for immediate assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
