export interface WhatsAppTemplateResponse {
  data: WhatsAppTemplate[];
  paging: Paging;
}

export interface WhatsAppTemplate {
  name: string;
  previous_category?: string;
  components: Component[];
  language: string;
  status: string;
  category: string;
  id: string;
}

export interface Component {
  type: ComponentType;
  format?: ComponentFormat;
  text?: string;
  example?: Example;
  buttons?: Button[];
}

export interface Example {
  body_text?: string[][];
}

export interface Button {
  type: ButtonType;
  text: string;
}

export interface Paging {
  cursors: Cursors;
}

export interface Cursors {
  before: string;
  after: string;
}

export type ComponentType = "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
export type ComponentFormat = "TEXT";
export type ButtonType = "QUICK_REPLY";