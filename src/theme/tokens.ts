// Colors copied from the design preview (light and dark)
export type Colors = {
  bg: string; card: string; text: string; muted: string; pri: string; btn: string; hd: string
  red: string; redbg: string; green: string; greenbg: string; amber: string; amberbg: string
  line: string; shadow: string
}

export const light: Colors = {
  bg: '#eef3f4', card: '#ffffff', text: '#17252a', muted: '#5f7075', pri: '#1f5c68', btn: '#1f5c68', hd: '#1f5c68',
  red: '#c0392b', redbg: '#fdeceb', green: '#2e8b57', greenbg: '#e6f4ec', amber: '#b7791f', amberbg: '#fdf3dc',
  line: '#e3eaec', shadow: '#143240',
}

export const dark: Colors = {
  bg: '#0c1416', card: '#152226', text: '#e6f0f2', muted: '#8fa5ab', pri: '#5cbccd', btn: '#2a7f8f', hd: '#123a42',
  red: '#ff8a80', redbg: '#3a1d1d', green: '#6fcf97', greenbg: '#17301f', amber: '#f2c260', amberbg: '#38300f',
  line: '#24363b', shadow: '#000000',
}
