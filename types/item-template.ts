export interface ItemTemplate {
    id: number;
    name: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
}

export interface ItemTemplateFormData {
    name: string;
    description?: string;
}
