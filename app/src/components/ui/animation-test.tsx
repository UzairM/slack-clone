'use client';

import { ChevronDown, Menu, MessageSquare, Plus, ThumbsUp, X } from 'lucide-react';
import { useState } from 'react';

export function AnimationTest() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="space-y-12">
      {/* Hover Animations */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Hover Animations</h2>
        <div className="flex flex-wrap gap-4">
          {/* Message Hover */}
          <div className="message-hover w-64">
            <h3 className="message-username">Message Hover</h3>
            <p className="message-text">Hover over this message</p>
          </div>

          {/* Button Hover */}
          <button className="button-primary">Primary Button</button>

          {/* Secondary Button Hover */}
          <button className="button-secondary">Secondary Button</button>

          {/* Reaction Badge Hover */}
          <div className="reaction-badge">
            <ThumbsUp className="reaction-icon" />
            <span className="reaction-count">5</span>
          </div>

          {/* Action Button Hover */}
          <button className="action-button">
            <MessageSquare className="action-button-icon" />
            <span className="action-button-text">Action</span>
          </button>
        </div>
      </section>

      {/* Transition Animations */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Transition Animations</h2>
        <div className="flex flex-wrap gap-4">
          {/* Input Focus */}
          <input type="text" placeholder="Focus me" className="input-primary max-w-xs" />

          {/* Container Card */}
          <div className="container-card p-4">
            <p>Card with shadow transition</p>
          </div>
        </div>
      </section>

      {/* Accordion Animation */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Accordion Animation</h2>
        <div className="w-full max-w-md border rounded-lg">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full p-4 text-left"
          >
            <span>Click to toggle</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              isOpen ? 'animate-accordion-down' : 'animate-accordion-up h-0'
            }`}
          >
            <div className="p-4 bg-muted">
              <p>Accordion content that smoothly animates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Slide and Fade Animations */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Slide & Fade Animations</h2>
        <div className="flex gap-4">
          <button onClick={() => setShowMessage(!showMessage)} className="button-primary">
            Toggle Message
          </button>

          {showMessage && (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <div className="container-card p-4">
                <p>This message slides in from the right</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mobile Menu Animation Example */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Mobile Menu Animation</h2>
        <div className="relative w-full max-w-md border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-background border-b">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="hover:bg-muted p-2 rounded-md transition-colors"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6 transition-transform duration-200" />
              ) : (
                <Menu className="w-6 h-6 transition-transform duration-200" />
              )}
            </button>
            <Plus className="w-6 h-6" />
          </div>

          {/* Menu Content */}
          <div
            className={`
              absolute top-[100%] left-0 w-full bg-background
              transform transition-all duration-300 ease-out
              ${showMobileMenu ? 'animate-slide-in-left' : '-translate-x-full'}
            `}
          >
            <div className="p-4 space-y-2 border-t">
              <button className="button-secondary w-full text-left py-2">Home</button>
              <button className="button-secondary w-full text-left py-2">Messages</button>
              <button className="button-secondary w-full text-left py-2">Profile</button>
              <button className="button-secondary w-full text-left py-2">Settings</button>
            </div>
          </div>

          {/* Menu Overlay */}
          {showMobileMenu && (
            <div
              className="fixed inset-0 bg-black/20 animate-fade-in"
              onClick={() => setShowMobileMenu(false)}
              style={{ zIndex: -1 }}
            />
          )}
        </div>

        {/* Animation Description */}
        <div className="text-sm text-muted-foreground">
          <p>Click the menu icon to toggle the mobile menu with slide animation.</p>
          <p>The menu slides in from the left with a fade overlay.</p>
        </div>
      </section>
    </div>
  );
}
