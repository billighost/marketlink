import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import styles from './ProfileDetails.module.css';

/**
 * Personal Details sheet for Customer profile.
 */
export function ProfileDetails({ inSheet = true, onClose }) {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || 'George Adams');
  const [firstName, setFirstName] = useState(user?.firstName || 'George');
  const [email, setEmail] = useState(user?.email || 'george@example.com');
  const [phone, setPhone] = useState(user?.phone || '(555) 234-5678');
  const [address, setAddress] = useState(user?.address || '74 Elmwood Ave, Maplewood, NJ');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user) {
      user.name = name;
      user.firstName = firstName;
      user.email = email;
      user.phone = phone;
      user.address = address;
    }
    setSaved(true);
    setTimeout(() => {
      onClose?.();
    }, 500);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <FormField
          id="name"
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <FormField
          id="firstName"
          label="First name (for market greetings)"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <FormField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FormField
          id="phone"
          label="Phone number (for pickup reminders)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <FormField
          id="address"
          label="Home address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <footer className={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          type="submit"
          className={styles.submitButton}
        >
          {saved ? 'Saved!' : 'Save changes'}
        </Button>
      </footer>
    </form>
  );
}

export default ProfileDetails;
