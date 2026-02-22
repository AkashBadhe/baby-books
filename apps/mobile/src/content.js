import generatedContent from "./content.generated.json";

export const categories = generatedContent.categoryDefinitions || [];
export const cardsByCategory = generatedContent.categoryCards || {};
