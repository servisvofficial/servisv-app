/** CAT-013 2024 - Municipios por departamento (igual que servisv-proyecto-web) */
export const MUNICIPIOS_POR_DEPARTAMENTO: Record<
  string,
  { codigo: string; nombre: string }[]
> = {
  "01": [
    { codigo: "13", nombre: "AHUACHAPAN NORTE" },
    { codigo: "14", nombre: "AHUACHAPAN CENTRO" },
    { codigo: "15", nombre: "AHUACHAPAN SUR" },
  ],
  "02": [
    { codigo: "14", nombre: "SANTA ANA NORTE" },
    { codigo: "15", nombre: "SANTA ANA CENTRO" },
    { codigo: "16", nombre: "SANTA ANA ESTE" },
    { codigo: "17", nombre: "SANTA ANA OESTE" },
  ],
  "03": [
    { codigo: "17", nombre: "SONSONATE NORTE" },
    { codigo: "18", nombre: "SONSONATE CENTRO" },
    { codigo: "19", nombre: "SONSONATE ESTE" },
    { codigo: "20", nombre: "SONSONATE OESTE" },
  ],
  "04": [
    { codigo: "34", nombre: "CHALATENANGO NORTE" },
    { codigo: "35", nombre: "CHALATENANGO CENTRO" },
    { codigo: "36", nombre: "CHALATENANGO SUR" },
  ],
  "05": [
    { codigo: "23", nombre: "LA LIBERTAD NORTE" },
    { codigo: "24", nombre: "LA LIBERTAD CENTRO" },
    { codigo: "25", nombre: "LA LIBERTAD OESTE" },
    { codigo: "26", nombre: "LA LIBERTAD ESTE" },
    { codigo: "27", nombre: "LA LIBERTAD COSTA" },
    { codigo: "28", nombre: "LA LIBERTAD SUR" },
  ],
  "06": [
    { codigo: "20", nombre: "SAN SALVADOR NORTE" },
    { codigo: "21", nombre: "SAN SALVADOR OESTE" },
    { codigo: "22", nombre: "SAN SALVADOR ESTE" },
    { codigo: "23", nombre: "SAN SALVADOR CENTRO" },
    { codigo: "24", nombre: "SAN SALVADOR SUR" },
  ],
  "07": [
    { codigo: "17", nombre: "CUSCATLAN NORTE" },
    { codigo: "18", nombre: "CUSCATLAN SUR" },
  ],
  "08": [
    { codigo: "23", nombre: "LA PAZ OESTE" },
    { codigo: "24", nombre: "LA PAZ CENTRO" },
    { codigo: "25", nombre: "LA PAZ ESTE" },
  ],
  "09": [
    { codigo: "10", nombre: "CABAÑAS OESTE" },
    { codigo: "11", nombre: "CABAÑAS ESTE" },
  ],
  "10": [
    { codigo: "14", nombre: "SAN VICENTE NORTE" },
    { codigo: "15", nombre: "SAN VICENTE SUR" },
  ],
  "11": [
    { codigo: "24", nombre: "USULUTAN NORTE" },
    { codigo: "25", nombre: "USULUTAN ESTE" },
    { codigo: "26", nombre: "USULUTAN OESTE" },
  ],
  "12": [
    { codigo: "21", nombre: "SAN MIGUEL NORTE" },
    { codigo: "22", nombre: "SAN MIGUEL CENTRO" },
    { codigo: "23", nombre: "SAN MIGUEL OESTE" },
  ],
  "13": [
    { codigo: "27", nombre: "MORAZAN NORTE" },
    { codigo: "28", nombre: "MORAZAN SUR" },
  ],
  "14": [
    { codigo: "19", nombre: "LA UNION NORTE" },
    { codigo: "20", nombre: "LA UNION SUR" },
  ],
};

export const DEPARTAMENTOS = [
  { value: "01", label: "Ahuachapán" },
  { value: "02", label: "Santa Ana" },
  { value: "03", label: "Sonsonate" },
  { value: "04", label: "Chalatenango" },
  { value: "05", label: "La Libertad" },
  { value: "06", label: "San Salvador" },
  { value: "07", label: "Cuscatlán" },
  { value: "08", label: "La Paz" },
  { value: "09", label: "Cabañas" },
  { value: "10", label: "San Vicente" },
  { value: "11", label: "Usulután" },
  { value: "12", label: "San Miguel" },
  { value: "13", label: "Morazán" },
  { value: "14", label: "La Unión" },
];
