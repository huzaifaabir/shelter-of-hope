import { useEffect } from "react";

export default function Seo({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} | Shelter of Hope` : "Shelter of Hope | নারী ও শিশু সুরক্ষা ও মানবিক সহায়তা";
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
  return null;
}
