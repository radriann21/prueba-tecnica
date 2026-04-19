interface apiClientArguments {
  url: string;
  options?: RequestInit;
  retries?: number;
  delay?: number;
}

export const apiClient = async <T>({
  url,
  options,
  retries = 3,
  delay = 1000,
}: apiClientArguments): Promise<T> => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Ha ocurrido un error HTTP: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (retries > 0) {
      console.warn(`La peticion ha fallado, reintando en  ${delay} ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient<T>({
        url,
        options,
        retries: retries - 1,
        delay: delay * 2,
      });
    }
    console.error(`Ha ocurrido un error: ${error}`);
    throw new Error(`La peticion no se ha podido cumplir.`);
  }
};
