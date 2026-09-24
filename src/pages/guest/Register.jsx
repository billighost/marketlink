import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import PageHeader from '@/components/layout/PageHeader';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import Illustration from '@/components/domain/Illustration';
import styles from './Register.module.css';

/**
 * Registration page with 2-step role selection and account creation.
 * Supports URL pre-selection (?role=customer or ?role=farmer).
 */
export function Register() {
  useDocumentTitle('Create Account · MarketLink');
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role')?.toLowerCase();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(
    roleParam === 'customer' || roleParam === 'farmer' ? roleParam : ''
  );

  // Auto-advance to step 2 if valid role query parameter is present
  useEffect(() => {
    if (roleParam === 'customer' || roleParam === 'farmer') {
      setRole(roleParam);
      setStep(2);
    }
  }, [roleParam]);

  // Form states
  const [customerData, setCustomerData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [farmerData, setFarmerData] = useState({
    stallName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  // Field refs
  const firstFieldRef = useRef(null);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFarmerChange = (e) => {
    const { name, value } = e.target;
    setFarmerData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateStep2 = () => {
    const newErrors = {};
    const data = role === 'customer' ? customerData : farmerData;

    if (role === 'customer') {
      if (!data.fullName.trim()) newErrors.fullName = 'Please enter your full name.';
    } else {
      if (!data.stallName.trim()) newErrors.stallName = 'Please enter your stall or business name.';
      if (!data.contactPerson.trim()) newErrors.contactPerson = 'Please enter a contact person name.';
    }

    if (!data.phone.trim()) {
      newErrors.phone = 'Please enter your contact number.';
    } else if (data.phone.replace(/\D/g, '').length < 7) {
      newErrors.phone = 'Contact number must have at least 7 digits.';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!data.email.includes('@') || !data.email.includes('.')) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!data.address.trim()) {
      newErrors.address = 'Please enter your address.';
    }

    if (!data.password) {
      newErrors.password = 'Please enter a password.';
    } else if (data.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!data.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    return newErrors;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!role) return;
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    const validationErrors = validateStep2();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Focus first error field if available
      firstFieldRef.current?.focus();
      return;
    }

    // Success step 3
    setStep(3);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PageHeader
          title={step === 3 ? 'Welcome' : 'Create your account'}
          subtitle={
            step === 1
              ? "First, tell us how you'll use MarketLink."
              : step === 2
              ? `Enter your details to create your ${role === 'customer' ? 'Customer' : 'Farmer'} account.`
              : undefined
          }
          backTo={step === 2 && !roleParam ? undefined : PATHS.HOME}
          backLabel="Home"
          className={styles.header}
        />

        {/* ---------------- STEP 1: CHOOSE ROLE ---------------- */}
        {step === 1 && (
          <div className={styles.stepWrapper}>
            <p className={styles.progressText}>Step 1 of 2</p>

            <form onSubmit={handleStep1Submit} className={styles.roleForm}>
              <fieldset className={styles.roleFieldset}>
                <legend className="visuallyHidden">Choose your account type</legend>

                <label
                  className={`${styles.roleCard} ${role === 'customer' ? styles.roleCardSelected : ''}`}
                >
                  <input
                    type="radio"
                    name="accountRole"
                    value="customer"
                    checked={role === 'customer'}
                    onChange={() => setRole('customer')}
                    className={styles.roleRadio}
                  />
                  <div className={styles.roleCardContent}>
                    <Illustration name="basket" size="md" className={styles.roleIllustration} />
                    <div className={styles.roleText}>
                      <span className={styles.roleTitle}>Customer</span>
                      <span className={styles.roleDesc}>
                        I want to browse Elm Street Market stalls, reserve Saturday harvest ahead of time, and pay the farmers directly at pickup.
                      </span>
                    </div>
                  </div>
                </label>

                <label
                  className={`${styles.roleCard} ${role === 'farmer' ? styles.roleCardSelected : ''}`}
                >
                  <input
                    type="radio"
                    name="accountRole"
                    value="farmer"
                    checked={role === 'farmer'}
                    onChange={() => setRole('farmer')}
                    className={styles.roleRadio}
                  />
                  <div className={styles.roleCardContent}>
                    <Illustration name="stall" size="md" className={styles.roleIllustration} />
                    <div className={styles.roleText}>
                      <span className={styles.roleTitle}>Farmer</span>
                      <span className={styles.roleDesc}>
                        I sell produce, sourdough, honey, or artisanal goods at Elm Street Market and want to list weekly harvest.
                      </span>
                    </div>
                  </div>
                </label>
              </fieldset>

              <div className={styles.actionsRow}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!role}
                  className={styles.fullWidthButton}
                >
                  Continue
                </Button>
              </div>

              <p className={styles.signInPrompt}>
                Already have an account?{' '}
                <Link to={PATHS.LOGIN} className={styles.signInLink}>
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        )}

        {/* ---------------- STEP 2: DETAILS FORM ---------------- */}
        {step === 2 && (
          <div className={styles.stepWrapper}>
            <div className={styles.stepNavRow}>
              <p className={styles.progressText}>Step 2 of 2</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            </div>

            <form onSubmit={handleStep2Submit} noValidate className={styles.detailsForm}>
              {role === 'customer' ? (
                /* Customer Fields */
                <>
                  <FormField
                    ref={firstFieldRef}
                    label="Full name"
                    id="register-fullname"
                    name="fullName"
                    value={customerData.fullName}
                    onChange={handleCustomerChange}
                    error={errors.fullName}
                    autoComplete="name"
                    required
                  />

                  <FormField
                    label="Contact number"
                    id="register-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={customerData.phone}
                    onChange={handleCustomerChange}
                    error={errors.phone}
                    autoComplete="tel"
                    hint="For order pickup notifications"
                    required
                  />

                  <FormField
                    label="Email address"
                    id="register-email"
                    name="email"
                    type="email"
                    value={customerData.email}
                    onChange={handleCustomerChange}
                    error={errors.email}
                    autoComplete="email"
                    required
                  />

                  <FormField
                    label="Address"
                    id="register-address"
                    name="address"
                    value={customerData.address}
                    onChange={handleCustomerChange}
                    error={errors.address}
                    autoComplete="street-address"
                    hint="Street address or neighbourhood"
                    required
                  />

                  <FormField
                    label="Password"
                    id="register-password"
                    name="password"
                    type="password"
                    value={customerData.password}
                    onChange={handleCustomerChange}
                    error={errors.password}
                    autoComplete="new-password"
                    hint="At least 8 characters."
                    required
                  />

                  <FormField
                    label="Confirm password"
                    id="register-confirmpassword"
                    name="confirmPassword"
                    type="password"
                    value={customerData.confirmPassword}
                    onChange={handleCustomerChange}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                    required
                  />

                  <div className={styles.submitRow}>
                    <Button type="submit" variant="primary" size="md" className={styles.fullWidthButton}>
                      Create Customer account
                    </Button>
                  </div>
                </>
              ) : (
                /* Farmer Fields */
                <>
                  <FormField
                    ref={firstFieldRef}
                    label="Stall or business name"
                    id="register-stallname"
                    name="stallName"
                    value={farmerData.stallName}
                    onChange={handleFarmerChange}
                    error={errors.stallName}
                    hint="e.g. Riverbend Farm or Oak & Mill Bakery"
                    required
                  />

                  <FormField
                    label="Contact person"
                    id="register-contactperson"
                    name="contactPerson"
                    value={farmerData.contactPerson}
                    onChange={handleFarmerChange}
                    error={errors.contactPerson}
                    autoComplete="name"
                    required
                  />

                  <FormField
                    label="Contact number"
                    id="register-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={farmerData.phone}
                    onChange={handleFarmerChange}
                    error={errors.phone}
                    autoComplete="tel"
                    required
                  />

                  <FormField
                    label="Email address"
                    id="register-email"
                    name="email"
                    type="email"
                    value={farmerData.email}
                    onChange={handleFarmerChange}
                    error={errors.email}
                    autoComplete="email"
                    required
                  />

                  <FormField
                    label="Address"
                    id="register-address"
                    name="address"
                    value={farmerData.address}
                    onChange={handleFarmerChange}
                    error={errors.address}
                    autoComplete="street-address"
                    hint="Farm location or bakery kitchen"
                    required
                  />

                  <FormField
                    label="Password"
                    id="register-password"
                    name="password"
                    type="password"
                    value={farmerData.password}
                    onChange={handleFarmerChange}
                    error={errors.password}
                    autoComplete="new-password"
                    hint="At least 8 characters."
                    required
                  />

                  <FormField
                    label="Confirm password"
                    id="register-confirmpassword"
                    name="confirmPassword"
                    type="password"
                    value={farmerData.confirmPassword}
                    onChange={handleFarmerChange}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                    required
                  />

                  <p className={styles.farmerNote}>
                    An admin will review your stall before you can list products.
                  </p>

                  <div className={styles.submitRow}>
                    <Button type="submit" variant="primary" size="md" className={styles.fullWidthButton}>
                      Create Farmer account
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}

        {/* ---------------- STEP 3: SUCCESS STATE ---------------- */}
        {step === 3 && (
          <div className={styles.successState}>
            {role === 'customer' ? (
              <>
                <div className={styles.successIllustration} aria-hidden="true">
                  <Illustration name="basket-tomatoes" size="lg" />
                </div>
                <h2 className={styles.successTitle}>You're registered for Elm Street Market</h2>
                <p className={styles.successText}>
                  Your Customer account is ready. Sign in to browse Saturday's board and pre-order your fresh harvest.
                </p>
                <Button
                  as={Link}
                  to={PATHS.LOGIN}
                  variant="primary"
                  size="md"
                >
                  Go to sign in
                </Button>
              </>
            ) : (
              <>
                <div className={styles.successIllustration} aria-hidden="true">
                  <Illustration name="stall" size="lg" />
                </div>
                <div className={styles.badgeWrapper}>
                  <span className={styles.approvalBadge}>Waiting for stall approval</span>
                </div>
                <h2 className={styles.successTitle}>Stall registered for review</h2>
                <p className={styles.successText}>
                  The Elm Street Market coordinators will review your stall profile and confirm your account before Friday's cut-off.
                </p>
                <Button
                  as={Link}
                  to={PATHS.HOME}
                  variant="primary"
                  size="md"
                >
                  Back to Elm Street
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
