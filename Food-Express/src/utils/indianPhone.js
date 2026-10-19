export const getIndianPhoneDigits = (phone) => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits;
};

export const isValidIndianPhone = (phone) => /^\d{10}$/.test(getIndianPhoneDigits(phone));
