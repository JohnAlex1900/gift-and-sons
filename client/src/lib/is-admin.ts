export const isAdminEmail = (
  userEmail: string | null | undefined,
  adminEmail: string | undefined,
) =>
  Boolean(
    userEmail?.trim() &&
      adminEmail?.trim() &&
      userEmail.trim().toLowerCase() === adminEmail.trim().toLowerCase(),
  );
