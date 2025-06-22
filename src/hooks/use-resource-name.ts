import { useEffect, useState } from "react";

type ResourceType = "patients" | "doctors" | "appointments";

export function useResourceName(id: string, resourceType?: ResourceType) {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!id || !resourceType) return;

    const fetchName = async () => {
      try {
        const res = await fetch(`/api/${resourceType}/${id}`);
        if (!res.ok) throw new Error("Erro na requisição");
        const data = await res.json();
        setName(data.name || "Desconhecido");
      } catch (error) {
        console.error(error);
        setName("Desconhecido");
      }
    };

    fetchName();
  }, [id, resourceType]);

  return name;
}
