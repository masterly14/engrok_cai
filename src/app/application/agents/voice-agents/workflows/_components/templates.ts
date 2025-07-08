import type { Node, Edge } from "reactflow";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Node[];
  edges: Edge[];
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "basic-greeting",
    name: "Saludo básico",
    description: "Un flujo simple de saludo y finalización de llamada",
    category: "Básico",
    nodes: [
      {
        id: "greeting-1",
        type: "conversation",
        position: { x: 100, y: 100 },
        data: {
          label: "Saludo inicial",
          type: "conversation",
          message: "¡Hola! Gracias por llamar. ¿En qué puedo ayudarte?",
        },
      },
      {
        id: "end-1",
        type: "endCall",
        position: { x: 100, y: 250 },
        data: {
          label: "Fin de llamada",
          type: "endCall",
          message: "Gracias por tu tiempo. ¡Que tengas un buen día!",
        },
      },
    ],
    edges: [
      {
        id: "greeting-to-end",
        source: "greeting-1",
        target: "end-1",
        type: "smartCondition",
        data: { condition: "Siempre" },
        animated: true,
      },
    ],
  },
  {
    id: "survey-flow",
    name: "Encuesta simple",
    description: "Flujo para recolectar información básica del usuario",
    category: "Encuestas",
    nodes: [
      {
        id: "welcome-2",
        type: "conversation",
        position: { x: 100, y: 50 },
        data: {
          label: "Bienvenida",
          type: "conversation",
          message:
            "Hola, vamos a hacer una breve encuesta. ¿Cuál es tu nombre?",
        },
      },
      {
        id: "collect-data-2",
        type: "apiRequest",
        position: { x: 100, y: 200 },
        data: {
          label: "Guardar respuesta",
          type: "apiRequest",
          endpoint: "/api/save-survey",
        },
      },
      {
        id: "thanks-2",
        type: "conversation",
        position: { x: 100, y: 350 },
        data: {
          label: "Agradecimiento",
          type: "conversation",
          message:
            "Perfecto, gracias por tu respuesta. ¿Algo más en lo que pueda ayudarte?",
        },
      },
      {
        id: "end-2",
        type: "endCall",
        position: { x: 100, y: 500 },
        data: {
          label: "Finalizar",
          type: "endCall",
          message: "Gracias por participar en nuestra encuesta. ¡Hasta luego!",
        },
      },
    ],
    edges: [
      {
        id: "welcome-to-collect",
        source: "welcome-2",
        target: "collect-data-2",
        type: "smartCondition",
        data: { condition: "Usuario responde" },
        animated: true,
      },
      {
        id: "collect-to-thanks",
        source: "collect-data-2",
        target: "thanks-2",
        type: "smartCondition",
        data: { condition: "Datos guardados" },
        animated: true,
      },
      {
        id: "thanks-to-end",
        source: "thanks-2",
        target: "end-2",
        type: "smartCondition",
        data: { condition: "Continuar" },
        animated: true,
      },
    ],
  },
  {
    id: "transfer-flow",
    name: "Transferencia rápida",
    description: "Evaluación rápida y transferencia a agente humano",
    category: "Soporte",
    nodes: [
      {
        id: "initial-3",
        type: "conversation",
        position: { x: 100, y: 50 },
        data: {
          label: "Evaluación inicial",
          type: "conversation",
          message:
            "Hola, entiendo que necesitas ayuda. ¿Es un tema técnico o comercial?",
        },
      },
      {
        id: "transfer-3",
        type: "transferCall",
        position: { x: 100, y: 200 },
        data: {
          label: "Transferir a agente",
          type: "transferCall",
          department: "soporte",
        },
      },
    ],
    edges: [
      {
        id: "initial-to-transfer",
        source: "initial-3",
        target: "transfer-3",
        type: "smartCondition",
        data: { condition: "Requiere agente humano" },
        animated: true,
      },
    ],
  },
  {
    id: "appointment-scheduler",
    name: "Agendador de Citas",
    description: "Flujo para agendar, reprogramar o cancelar citas.",
    category: "Soporte",
    nodes: [
      {
        id: "start",
        type: "conversation",
        position: {
          x: -705.8237557575243,
          y: -740.9114717829991,
        },
        data: {
          label: "Inicio",
          type: "conversation",
          message:
            "Gracias por llamar a Wellness Partners. Soy Riley, tu asistente de agendamiento. ¿Cómo puedo ayudarte hoy? Puedo agendar, reprogramar, cancelar o responder preguntas generales.",
        },
      },
      {
        id: "customer_type",
        type: "conversation",
        position: {
          x: -1471.8258644292039,
          y: 316.2993071890038,
        },
        data: {
          label: "Tipo de cliente",
          type: "conversation",
          message:
            "¿Eres un paciente nuevo en Wellness Partners o ya nos has visitado antes? Esto me ayuda a darte la asistencia correcta para tu cita.",
        },
      },
      {
        id: "new_appointment",
        type: "conversation",
        position: { x: -388.5315683262705, y: -17.01201596644613 },
        data: {
          label: "Nueva cita",
          type: "conversation",
          message:
            "¿Qué tipo de cita necesitas hoy? ¿Tienes preferencia por algún proveedor o deseas la primera disponible? También evaluaré el nivel de urgencia según tus necesidades.",
        },
      },
      {
        id: "reschedule_cancel",
        type: "conversation",
        position: { x: 722.7050867585804, y: -15.223871902985678 },
        data: {
          label: "Reprogramar/Cancelar",
          type: "conversation",
          message:
            "Te ayudaré con eso. ¿Puedes darme tu nombre y fecha de nacimiento para encontrar tu cita? Dime si quieres reprogramar o cancelar.",
        },
      },
      {
        id: "general_info",
        type: "conversation",
        position: { x: -2193.344692421535, y: 708.1282558087164 },
        data: {
          label: "Información General",
          type: "conversation",
          message:
            "Horario: Lunes a Viernes de 8am a 5pm, Sábados de 9am a 12pm. Aceptamos la mayoría de los planes de seguro. Para preguntas específicas sobre cobertura, contacta a tu seguro directamente. ¿Necesitas algo más o quieres agendar una cita?",
        },
      },
      {
        id: "urgent_triage",
        type: "conversation",
        position: { x: -1141.9725905844539, y: 739.5341850995003 },
        data: {
          label: "Triage Urgente",
          type: "conversation",
          message:
            "¿Puedes describir brevemente tus síntomas? Si son síntomas de emergencia, llama al 911 o ve a la sala de emergencias más cercana. Para casos urgentes pero no de emergencia, puedo ofrecerte opciones de cita para el mismo día.",
        },
      },
      {
        id: "collect_info",
        type: "conversation",
        position: { x: -1618.942009199001, y: 1126.5941398711234 },
        data: {
          label: "Recolectar Información",
          type: "conversation",
          message:
            "Necesito tus datos. Para pacientes nuevos: 'Necesito tu nombre completo, fecha de nacimiento y número de teléfono'. Para pacientes existentes: 'Necesito tu nombre y fecha de nacimiento para acceder a tu historial'.",
        },
      },
      {
        id: "collect_info_urgent",
        type: "conversation",
        position: { x: -754.7613039283544, y: 358.46312937002205 },
        data: {
          label: "Recolectar Info. Urgente",
          type: "conversation",
          message:
            "Necesito tus datos para la cita urgente. Para pacientes nuevos: 'Necesito tu nombre completo, fecha de nacimiento y número de teléfono'. Para pacientes existentes: 'Necesito tu nombre y fecha de nacimiento para acceder a tu historial'.",
        },
      },
      {
        id: "reschedule",
        type: "conversation",
        position: { x: 96.73649340762202, y: 396.0532505663149 },
        data: {
          label: "Reprogramar",
          type: "conversation",
          message:
            "Encontré tu cita del [fecha] a las [hora]. Aquí hay nuevos horarios disponibles: [opciones]. Confirma tu selección y actualizaré la cita.",
        },
      },
      {
        id: "cancel",
        type: "conversation",
        position: { x: 97.7396338091923, y: 708.6158383641339 },
        data: {
          label: "Cancelar",
          type: "conversation",
          message:
            "Encontré tu cita del [fecha]. Puedo cancelarla. Nota: se requiere un aviso de 24 horas para evitar un cargo de $50. Confirma la cancelación y dime si prefieres reprogramar.",
        },
      },
      {
        id: "reschedule_from_cancel",
        type: "conversation",
        position: { x: 1155.7930375388546, y: 1155.7930375388546 },
        data: {
          label: "Reprogramar desde Cancelación",
          type: "conversation",
          message:
            "Reprogramaré tu cita en su lugar. Aquí hay horarios disponibles: [opciones]. Confirma tu selección y actualizaré la cita.",
        },
      },
      {
        id: "customer_type_from_info",
        type: "conversation",
        position: { x: 1277.0746535656376, y: 1017.0948288126076 },
        data: {
          label: "Tipo de Cliente (desde Info)",
          type: "conversation",
          message:
            "¿Eres un paciente nuevo en Wellness Partners o ya nos has visitado antes?",
        },
      },
      {
        id: "new_appointment_from_info",
        type: "conversation",
        position: { x: 1236.6097216819107, y: 1534.4487114207577 },
        data: {
          label: "Nueva Cita (desde Info)",
          type: "conversation",
          message:
            "¿Qué tipo de cita necesitas hoy? ¿Tienes preferencia por algún proveedor o deseas la primera disponible?",
        },
      },
      {
        id: "collect_info_from_info",
        type: "conversation",
        position: { x: -2192.1700111914006, y: 1728.7544435802308 },
        data: {
          label: "Recolectar Info (desde Info)",
          type: "conversation",
          message:
            "Necesito tus datos. Para pacientes nuevos: nombre completo, fecha de nacimiento y teléfono. Para pacientes existentes: nombre y fecha de nacimiento.",
        },
      },
      {
        id: "emergency_redirect",
        type: "conversation",
        position: { x: -1148.0525139142742, y: 1215.7805533900807 },
        data: {
          label: "Redirección de Emergencia",
          type: "conversation",
          message:
            "Esto suena como una emergencia médica. Llama al 911 o ve a la sala de emergencias más cercana de inmediato. Puedo darte indicaciones o conectarte con nuestra enfermera de triage si es necesario. Mantén la calma pero actúa con urgencia.",
        },
      },
      {
        id: "schedule_time",
        type: "conversation",
        position: { x: -1616.3897378665279, y: 1514.66031918779 },
        data: {
          label: "Agendar Horario",
          type: "conversation",
          message:
            "Para {{appointment_type}}, tengo disponible el [fecha] a las [hora] o el [fecha] a las [hora]. ¿Cuál prefieres? Confirma tu selección.",
        },
      },
      {
        id: "schedule_time_urgent",
        type: "conversation",
        position: { x: 1264.9351740005195, y: 2083.209592393373 },
        data: {
          label: "Agendar Horario Urgente",
          type: "conversation",
          message:
            "Para {{appointment_type}} urgente, tengo disponibilidad para hoy a las [hora] o [hora]. ¿Cuál te funciona? Confirma tu selección.",
        },
      },
      {
        id: "schedule_time_from_info",
        type: "conversation",
        position: { x: -1147.2083634850887, y: 1520.2095032887985 },
        data: {
          label: "Agendar Horario (desde Info)",
          type: "conversation",
          message:
            "Para {{appointment_type}}, tengo disponible el [fecha] a las [hora] o el [fecha] a las [hora]. ¿Cuál prefieres?",
        },
      },
      {
        id: "confirm_appointment",
        type: "conversation",
        position: { x: 1280.4936711110045, y: 2486.037813494239 },
        data: {
          label: "Confirmar Cita",
          type: "conversation",
          message:
            "Confirmado: tienes una cita para {{appointment_type}} el {{selected_date}} a las {{selected_time}}. Instrucciones de llegada según {{customer_type}}: Pacientes nuevos llegar 20 min antes, existentes 15 min antes. Trae tu tarjeta de seguro e identificación. ¿Deseas un recordatorio?",
        },
      },
      {
        id: "confirm_appointment_urgent",
        type: "conversation",
        position: { x: 245, y: 771 },
        data: {
          label: "Confirmar Cita Urgente",
          type: "conversation",
          message:
            "Confirmado: cita urgente para {{appointment_type}} el {{selected_date}} a las {{selected_time}}. Instrucciones de llegada según {{customer_type}}: Nuevos 20 min antes, existentes 15 min. Trae seguro e ID.",
        },
      },
      {
        id: "confirm_appointment_from_info",
        type: "conversation",
        position: { x: 2004.5298396262576, y: 907 },
        data: {
          label: "Confirmar Cita (desde Info)",
          type: "conversation",
          message:
            "Confirmado: cita para {{appointment_type}} el {{selected_date}} a las {{selected_time}}. Instrucciones de llegada según {{customer_type}}: Nuevos 20 min antes, existentes 15 min. Trae seguro e ID. ¿Deseas recordatorio?",
        },
      },
      {
        id: "node_1748494934592",
        type: "conversation",
        position: { x: 1150, y: 107 },
        data: {
          label: "Hablar con humano",
          type: "conversation",
          message:
            "Confirma que quieres hablar con un humano y pregunta sobre qué tema.",
        },
      },
      {
        id: "transfer-call",
        type: "transferCall",
        position: { x: 1150, y: 220 },
        data: {
          label: "Transferir Llamada",
          type: "transferCall",
          department: "soporte",
        },
      },
      {
        id: "hangup_1748495964695",
        type: "endCall",
        position: { x: 560, y: 991 },
        data: {
          label: "Finalizar",
          type: "endCall",
          message:
            "Gracias por llamar a Wellness Partners. ¡Que tengas un buen día!",
        },
      },
    ],
    edges: [
      {
        id: "start-to-customer_type",
        source: "start",
        target: "customer_type",
        type: "smartCondition",
        data: { condition: "Usuario quiere agendar una nueva cita" },
        animated: true,
      },
      {
        id: "start-to-reschedule_cancel",
        source: "start",
        target: "reschedule_cancel",
        type: "smartCondition",
        data: { condition: "Usuario quiere reprogramar o cancelar una cita" },
        animated: true,
      },
      {
        id: "start-to-general_info",
        source: "start",
        target: "general_info",
        type: "smartCondition",
        data: {
          condition:
            "Usuario tiene preguntas sobre información de la clínica, horarios o servicios",
        },
        animated: true,
      },
      {
        id: "customer_type-to-new_appointment",
        source: "customer_type",
        target: "new_appointment",
        type: "smartCondition",
        data: {
          condition:
            "Tipo de usuario determinado, listo para proceder con el agendamiento",
        },
        animated: true,
      },
      {
        id: "new_appointment-to-urgent_triage",
        source: "new_appointment",
        target: "urgent_triage",
        type: "smartCondition",
        data: { condition: "Usuario indicó necesidad de atención urgente" },
        animated: true,
      },
      {
        id: "new_appointment-to-collect_info",
        source: "new_appointment",
        target: "collect_info",
        type: "smartCondition",
        data: { condition: "Usuario necesita una cita de rutina" },
        animated: true,
      },
      {
        id: "reschedule_cancel-to-reschedule",
        source: "reschedule_cancel",
        target: "reschedule",
        type: "smartCondition",
        data: { condition: "Usuario quiere reprogramar la cita" },
        animated: true,
      },
      {
        id: "reschedule_cancel-to-cancel",
        source: "reschedule_cancel",
        target: "cancel",
        type: "smartCondition",
        data: { condition: "Usuario quiere cancelar la cita" },
        animated: true,
      },
      {
        id: "general_info-to-customer_type_from_info",
        source: "general_info",
        target: "customer_type_from_info",
        type: "smartCondition",
        data: {
          condition: "Usuario quiere agendar después de recibir información",
        },
        animated: true,
      },
      {
        id: "general_info-to-hangup_1748495964695",
        source: "general_info",
        target: "hangup_1748495964695",
        type: "smartCondition",
        data: {
          condition: "Preguntas del usuario respondidas, no necesita más ayuda",
        },
        animated: true,
      },
      {
        id: "urgent_triage-to-emergency_redirect",
        source: "urgent_triage",
        target: "emergency_redirect",
        type: "smartCondition",
        data: { condition: "Síntomas indican una emergencia médica" },
        animated: true,
      },
      {
        id: "urgent_triage-to-collect_info_urgent",
        source: "urgent_triage",
        target: "collect_info_urgent",
        type: "smartCondition",
        data: {
          condition:
            "Urgente pero no es emergencia, se puede agendar para el mismo día",
        },
        animated: true,
      },
      {
        id: "collect_info-to-schedule_time",
        source: "collect_info",
        target: "schedule_time",
        type: "smartCondition",
        data: {
          condition: "Información del paciente recolectada exitosamente",
        },
        animated: true,
      },
      {
        id: "collect_info_urgent-to-schedule_time_urgent",
        source: "collect_info_urgent",
        target: "schedule_time_urgent",
        type: "smartCondition",
        data: {
          condition: "Información de paciente urgente recolectada exitosamente",
        },
        animated: true,
      },
      {
        id: "reschedule-to-hangup_1748495964695",
        source: "reschedule",
        target: "hangup_1748495964695",
        type: "smartCondition",
        data: { condition: "Cita reprogramada exitosamente" },
        animated: true,
      },
      {
        id: "cancel-to-reschedule_from_cancel",
        source: "cancel",
        target: "reschedule_from_cancel",
        type: "smartCondition",
        data: { condition: "Paciente quiere reprogramar en vez de cancelar" },
        animated: true,
      },
      {
        id: "cancel-to-hangup_1748495964695",
        source: "cancel",
        target: "hangup_1748495964695",
        type: "smartCondition",
        data: { condition: "Cita cancelada, no se necesita reprogramación" },
        animated: true,
      },
      {
        id: "reschedule_from_cancel-to-hangup_1748495964695",
        source: "reschedule_from_cancel",
        target: "hangup_1748495964695",
        type: "smartCondition",
        data: { condition: "Cita reprogramada desde cancelación" },
        animated: true,
      },
      {
        id: "customer_type_from_info-to-new_appointment_from_info",
        source: "customer_type_from_info",
        target: "new_appointment_from_info",
        type: "smartCondition",
        data: {
          condition:
            "Tipo de cliente determinado después de información general",
        },
        animated: true,
      },
      {
        id: "new_appointment_from_info-to-collect_info_from_info",
        source: "new_appointment_from_info",
        target: "collect_info_from_info",
        type: "smartCondition",
        data: {
          condition: "Tipo de cita determinado después de información general",
        },
        animated: true,
      },
      {
        id: "emergency_redirect-to-hangup_1748495964695",
        source: "emergency_redirect",
        target: "hangup_1748495964695",
        type: "smartCondition",
        data: { condition: "Guía de emergencia proporcionada" },
        animated: true,
      },
      {
        id: "schedule_time-to-confirm_appointment",
        source: "schedule_time",
        target: "confirm_appointment",
        type: "smartCondition",
        data: { condition: "Paciente seleccionó hora de la cita" },
        animated: true,
      },
      {
        id: "schedule_time_urgent-to-confirm_appointment_urgent",
        source: "schedule_time_urgent",
        target: "confirm_appointment_urgent",
        type: "smartCondition",
        data: { condition: "Paciente seleccionó hora de la cita urgente" },
        animated: true,
      },
      {
        id: "collect_info_from_info-to-schedule_time_from_info",
        source: "collect_info_from_info",
        target: "schedule_time_from_info",
        type: "smartCondition",
        data: {
          condition:
            "Información del paciente recolectada después de información general",
        },
        animated: true,
      },
      {
        id: "schedule_time_from_info-to-confirm_appointment_from_info",
        source: "schedule_time_from_info",
        target: "confirm_appointment_from_info",
        type: "smartCondition",
        data: {
          condition:
            "Paciente seleccionó hora de la cita después de información general",
        },
        animated: true,
      },
      {
        id: "confirm_appointment-to-hangup_1748495964695",
        source: "confirm_appointment",
        target: "hangup_1748495964695",
        type: "smartCondition",
        data: { condition: "Cita confirmada e instrucciones dadas" },
        animated: true,
      },
      {
        id: "confirm_appointment_urgent-to-hangup_1748495964695",
        source: "confirm_appointment_urgent",
        target: "hangup_1748495964695",
        type: "smartCondition",
        data: { condition: "Cita urgente confirmada e instrucciones dadas" },
        animated: true,
      },
      {
        id: "confirm_appointment_from_info-to-hangup_1748495964695",
        source: "confirm_appointment_from_info",
        target: "hangup_1748495964695",
        type: "smartCondition",
        data: {
          condition: "Cita confirmada después del flujo de información general",
        },
        animated: true,
      },
      {
        id: "node_1748494934592-to-transfer-call",
        source: "node_1748494934592",
        target: "transfer-call",
        type: "smartCondition",
        data: {
          condition:
            "Usuario confirma que quiere hablar con un humano y describe sobre qué quiere hablar",
        },
        animated: true,
      },
    ],
  },
];
