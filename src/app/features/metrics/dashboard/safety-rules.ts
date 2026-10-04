// Static explanatory content from the Figma frame. The backend has no endpoint for rules:
// the automatic loop runs on the Edge (docs/api-dtos.md, Safety & Actuation).

export interface SafetyRule {
  code: string;
  title: string;
  causeIcon: 'gas' | 'noise';
  cause: string;
  relay: string;
  actions: string[];
}

export const SAFETY_RULES: SafetyRule[] = [
  {
    code: 'Regla 01',
    title: 'Enclavamiento por Acumulación Crítica de Gas',
    causeIcon: 'gas',
    cause: 'Exceso en Concentración Ambiental de CO₂',
    relay: 'Auto-Relé #04',
    actions: [
      'Extractores aumentan al 100% de potencia',
      'Cierre de mamparas únicamente si no hay detección de movimiento',
    ],
  },
  {
    code: 'Regla 02',
    title: 'Atenuador de Peligro Acústico en Mecanizado',
    causeIcon: 'noise',
    cause: 'Pico de Exposición Continua a Decibeles',
    relay: 'Auto-Relé #09',
    actions: [
      'Activar alarma sonora preventiva para evacuar el área',
      'Despliegue de cortinas acústicas tras confirmar desocupación',
    ],
  },
];
