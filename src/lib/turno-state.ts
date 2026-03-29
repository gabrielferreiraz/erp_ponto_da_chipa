const globalTurno = global as typeof global & { 
  isClosingShift?: boolean 
} 

if (globalTurno.isClosingShift === undefined) { 
  globalTurno.isClosingShift = false 
} 

export const turnoState = { 
  get: () => globalTurno.isClosingShift ?? false, 
  set: (value: boolean) => { globalTurno.isClosingShift = value } 
}
