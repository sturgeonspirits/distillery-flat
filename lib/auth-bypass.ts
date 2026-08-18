export function isPasswordAuthDisabled() {
  return process.env.DISABLE_PASSWORD_AUTH?.trim().toLowerCase() === "true";
}

export function getPasswordBypassUser() {
  return {
    id: "password-auth-disabled",
    email:
      process.env.ADMIN_EMAIL?.trim() ||
      process.env.APP_ADMIN_EMAIL?.trim() ||
      "public@distilleryflat.local",
  };
}
