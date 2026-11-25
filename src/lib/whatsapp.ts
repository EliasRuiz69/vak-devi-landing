// Punto único del número de WhatsApp de Vak Devi y del formato de los
// enlaces wa.me. El número es público (es el de atención de Vak Devi).
export const WHATSAPP_NUMERO = "529834432036";

// Mensaje precargado por defecto al abrir el chat desde la web.
export const WHATSAPP_MENSAJE_WEB =
  "Hola, me gustaría recibir información sobre la Primera Cita Virtual Exploratoria Gratuita.";

export function waLink(mensaje: string = WHATSAPP_MENSAJE_WEB): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}
