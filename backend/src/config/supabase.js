// Cliente de almacenamiento desacoplado de dependencias externas
export const supabase = {
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};
