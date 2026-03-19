const errorMessagesClerkES: Record<string, string> = {
  form_identifier_not_found: "No se encontró una cuenta con este correo electrónico.",
  form_password_incorrect: "La contraseña es incorrecta.",
  form_param_format_invalid: "El formato del campo no es válido.",
  form_param_format_invalid_email_address: "El formato del correo electrónico no es válido.",
  form_param_nil: "Este campo es obligatorio.",
  form_password_pwned: "Esta contraseña ha sido comprometida. Por favor, usa otra contraseña.",
  form_password_length_too_short: "La contraseña es demasiado corta.",
  form_password_length_too_long: "La contraseña es demasiado larga.",
  form_password_pwned_and_common: "Esta contraseña es común y ha sido comprometida. Por favor, usa una contraseña más segura.",
  form_username_invalid: "El nombre de usuario no es válido.",
  form_username_invalid_length: "El nombre de usuario debe tener entre 3 y 256 caracteres.",
  form_param_max_length_exceeded: "El campo excede la longitud máxima permitida.",
  form_param_min_length_not_met: "El campo no cumple con la longitud mínima requerida.",
};

export const clerkErrorValidator = (error: any) => {
  let errorField = "root";
  let displayMessage = "Ocurrió un error inesperado. Por favor, intenta de nuevo.";

  switch (error.meta?.paramName) {
    case 'identifier':
      errorField = 'email';
      break;
    case 'password':
      errorField = 'password';
      break;
    default:
      errorField = 'root';
      break;
  }

  if (error.code && error.longMessage) {
    const clerkErrorCode = error.code;
    const longMessage = error.longMessage;

    displayMessage = errorMessagesClerkES[clerkErrorCode] || longMessage || displayMessage;

    if (clerkErrorCode === "form_param_format_invalid" && error.errors[0]?.meta?.paramName) {
      const specificKey = `form_param_format_invalid_${error.errors[0].meta.paramName}`;
      displayMessage = errorMessagesClerkES[specificKey] || errorMessagesClerkES[clerkErrorCode] || longMessage || displayMessage;
    }
  } else if (error.message) {
    displayMessage = error.message;
  }

  return { errorField, displayMessage };
};
