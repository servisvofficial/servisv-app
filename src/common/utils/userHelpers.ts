/**
 * Obtiene las iniciales del nombre de un usuario
 * @param name - Nombre del usuario
 * @param lastName - Apellido del usuario (opcional)
 * @returns Las iniciales (máximo 2 caracteres)
 */
export const getUserInitials = (name?: string, lastName?: string): string => {
  if (!name) return "U";

  const firstInitial = name.charAt(0).toUpperCase();
  
  if (lastName) {
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  // Si solo hay nombre, tomar las primeras dos letras si tiene más de una
  if (name.length > 1) {
    return name.substring(0, 2).toUpperCase();
  }

  return firstInitial;
};

/**
 * Obtiene el nombre completo del usuario
 * @param name - Nombre del usuario
 * @param lastName - Apellido del usuario (opcional)
 * @returns El nombre completo
 */
export const getFullName = (name?: string, lastName?: string): string => {
  if (!name) return "Usuario";
  
  if (lastName) {
    return `${name} ${lastName}`;
  }
  
  return name;
};
