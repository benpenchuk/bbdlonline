import React, { useState } from 'react';
import { Mail, Phone, Send, CheckCircle, AlertCircle, MapPin, Clock, MessageSquare, Users } from 'lucide-react';
import { getConfig } from '../core/config/appConfig';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const config = getConfig();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    setSubmitStatus('submitting');

    // Simulate form submission (since this is a demo)
    setTimeout(() => {
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <div className="contact-hero">
        <div className="contact-hero-content">
          <div className="hero-badge">
            <MessageSquare size={20} />
            <span>Get In Touch</span>
          </div>
          <h1>Contact {config.league.name}</h1>
          <p>We're here to help with any questions about the league, games, or registration.</p>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <Users size={24} />
            <div>
              <span className="stat-number">24h</span>
              <span className="stat-label">Response Time</span>
            </div>
          </div>
          <div className="hero-stat">
            <Clock size={24} />
            <div>
              <span className="stat-number">M-F</span>
              <span className="stat-label">Available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-container">
        {/* Contact Methods Grid */}
        <div className="contact-methods-grid">
          <div className="contact-method-card">
            <div className="method-icon email-icon">
              <Mail size={28} />
            </div>
            <div className="method-content">
              <h3>Email Us</h3>
              <p className="method-value">{config.league.contactEmail}</p>
              <p className="method-description">Best for detailed questions and official inquiries</p>
              <span className="response-time">Usually responds in 2-4 hours</span>
            </div>
          </div>

          <div className="contact-method-card">
            <div className="method-icon phone-icon">
              <Phone size={28} />
            </div>
            <div className="method-content">
              <h3>Call Us</h3>
              <p className="method-value">{config.league.contactPhone}</p>
              <p className="method-description">For urgent matters and immediate assistance</p>
              <span className="response-time">Available Mon-Fri, 9AM-5PM</span>
            </div>
          </div>

          <div className="contact-method-card">
            <div className="method-icon location-icon">
              <MapPin size={28} />
            </div>
            <div className="method-content">
              <h3>Visit Us</h3>
              <p className="method-value">League Office</p>
              <p className="method-description">Schedule an appointment to meet in person</p>
              <span className="response-time">By appointment only</span>
            </div>
          </div>
        </div>

        <div className="contact-main-content">
          {/* Contact Form */}
          <div className="contact-form-section">
            <div className="form-header">
              <h2>Send us a Message</h2>
              <p>Have questions about registration, schedules, or rules? We're here to help!</p>
            </div>

            {submitStatus === 'success' && (
              <div className="success-message">
                <div className="success-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="success-content">
                  <h3>Message Sent Successfully!</h3>
                  <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && Object.keys(errors).length > 0 && (
              <div className="error-message">
                <div className="error-icon">
                  <AlertCircle size={20} />
                </div>
                <p>Please fix the errors below and try again.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-contact-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`modern-input ${errors.name ? 'input-error' : ''}`}
                    placeholder="John Doe"
                    disabled={submitStatus === 'submitting'}
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`modern-input ${errors.email ? 'input-error' : ''}`}
                    placeholder="john@example.com"
                    disabled={submitStatus === 'submitting'}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={`modern-input ${errors.subject ? 'input-error' : ''}`}
                  disabled={submitStatus === 'submitting'}
                >
                  <option value="">What can we help you with?</option>
                  <option value="general">General Inquiry</option>
                  <option value="team-registration">Team Registration</option>
                  <option value="player-registration">Player Registration</option>
                  <option value="schedule">Schedule Question</option>
                  <option value="rules">Rules & Regulations</option>
                  <option value="technical">Technical Issue</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
                {errors.subject && <span className="field-error">{errors.subject}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className={`modern-input modern-textarea ${errors.message ? 'input-error' : ''}`}
                  placeholder="Tell us more about your question or concern..."
                  rows={5}
                  disabled={submitStatus === 'submitting'}
                />
                <div className="textarea-footer">
                  <span className="character-count">
                    {formData.message.length}/500 characters
                  </span>
                </div>
                {errors.message && <span className="field-error">{errors.message}</span>}
              </div>

              <button 
                type="submit" 
                className="submit-button"
                disabled={submitStatus === 'submitting'}
              >
                {submitStatus === 'submitting' ? (
                  <>
                    <div className="button-spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Info Sidebar */}
          <div className="contact-sidebar">
            <div className="quick-info-card">
              <h3>Quick Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <Clock size={16} />
                  <div>
                    <strong>Response Time</strong>
                    <p>We typically respond within 2-4 hours during business hours</p>
                  </div>
                </div>
                <div className="info-item">
                  <Users size={16} />
                  <div>
                    <strong>Office Hours</strong>
                    <p>Monday - Friday: 9:00 AM - 5:00 PM<br />
                       Saturday: 10:00 AM - 2:00 PM<br />
                       Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="faq-card">
              <h3>Frequently Asked</h3>
              <div className="faq-list">
                <div className="faq-item">
                  <strong>How do I register my team?</strong>
                  <p>Visit our registration page or contact us directly for assistance.</p>
                </div>
                <div className="faq-item">
                  <strong>When are games scheduled?</strong>
                  <p>Games are typically scheduled on weekends. Check our schedule page for details.</p>
                </div>
                <div className="faq-item">
                  <strong>What equipment is provided?</strong>
                  <p>The league provides all necessary game equipment. Players just need to bring themselves!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-footer">
          <div className="footer-note">
            <AlertCircle size={16} />
            <p>This is a demonstration contact form. In production, messages would be sent to league organizers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
