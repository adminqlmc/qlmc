export function validateStrongPassword(password: string): { ok: boolean; message?: string } {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const lengthOk = password.length >= 8;
  const upperOk = /[A-Z]/.test(password);
  const lowerOk = /[a-z]/.test(password);
  const numberOk = /[0-9]/.test(password);
  const specialOk = /[^A-Za-z0-9]/.test(password);

  if (lengthOk && upperOk && lowerOk && numberOk && specialOk) {
    return { ok: true };
  }

  return {
    ok: false,
    message:
      'Mật khẩu phải tối thiểu 8 ký tự và gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
  };
}
