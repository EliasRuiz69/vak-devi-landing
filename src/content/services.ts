export type Service = {
  id: string;
  name: string;
  description: string;
  premium?: boolean;
  tools?: string[];
};

export const services: Service[] = [
  {
    id: "psicoterapia-individual",
    name: "Psicoterapia individual, de parejas y familiar",
    description:
      "Un espacio seguro y confidencial para explorar tus emociones, sanar heridas del pasado y desarrollar recursos internos que te permitan vivir con más plenitud y autenticidad.",
  },
  {
    id: "coaching-desarrollo-humano",
    name: "Coaching para el crecimiento personal",
    description:
      "Para quienes están en un momento de transición o búsqueda. Trabajamos juntos tus metas, valores y creencias para que puedas tomar decisiones desde quién realmente eres.",
  },
  {
    id: "acompanamiento-crisis",
    name: "Acompañamiento en crisis",
    description:
      "Cuando la vida parece desbordarse, tener un espacio de escucha y claridad puede marcar la diferencia. Sesiones de apoyo intensivo para momentos de quiebre o duelo.",
  },
  {
    id: "talleres-grupos-vivenciales",
    name: "Talleres y grupos vivenciales",
    description:
      "Experiencias colectivas de autoconocimiento y crecimiento personal. Un lugar donde encontrarte con otros que también están aprendiendo a habitarse.",
  },
  {
    id: "eqi-2",
    name: "Evaluación de Inteligencia Emocional EQ-i 2.0",
    description:
      "Un test certificado internacionalmente que mide 15 competencias de inteligencia emocional. Como evaluadora certificada del instrumento, aplico el test, elaboro un informe detallado de resultados y te acompaño en una sesión para interpretarlos juntos y trazar un plan de crecimiento personal.",
    premium: true,
  },
  {
    id: "inteligencia-espiritual",
    name: "Reconexión con tu inteligencia espiritual",
    description:
      "A través de un enfoque holístico e integrativo, exploramos juntos esa dimensión interior con diversas herramientas de acompañamiento adaptadas a tu proceso único.",
  },
];
