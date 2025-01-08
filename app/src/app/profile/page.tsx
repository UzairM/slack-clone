'use client';

import AccountInfo from '@/components/profile/account-info';
import BasicProfileForm from '@/components/profile/basic-profile-form';
import ContactForm from '@/components/profile/contact-form';
import PresenceForm from '@/components/profile/presence-form';
import PrivacyForm from '@/components/profile/privacy-form';
import ProfileMetadataForm from '@/components/profile/profile-metadata-form';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';

const sidebarNavItems = [
  {
    title: 'Basic Profile',
    href: '#basic-profile',
    component: BasicProfileForm,
  },
  {
    title: 'Presence Information',
    href: '#presence',
    component: PresenceForm,
  },
  {
    title: 'Contact Information',
    href: '#contact',
    component: ContactForm,
  },
  {
    title: 'Profile Privacy',
    href: '#privacy',
    component: PrivacyForm,
  },
  {
    title: 'Account Information',
    href: '#account',
    component: AccountInfo,
  },
  {
    title: 'Profile Metadata',
    href: '#metadata',
    component: ProfileMetadataForm,
  },
];

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState('basic-profile');

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId.replace('#', ''));
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Manage your profile settings and preferences.</p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="space-y-4">
              <div className="space-y-2">
                {sidebarNavItems.map(item => (
                  <Button
                    key={item.href}
                    variant={activeSection === item.href.replace('#', '') ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      activeSection === item.href.replace('#', '') && 'bg-muted'
                    )}
                    onClick={() => scrollToSection(item.href)}
                  >
                    {item.title}
                  </Button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </aside>
        <div className="flex-1 lg:max-w-3xl">
          <ScrollArea className="h-[calc(100vh-10rem)]">
            {sidebarNavItems.map(({ href, component: Component }) => (
              <section key={href} id={href.replace('#', '')} className="space-y-6 pb-12">
                <Component />
              </section>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
