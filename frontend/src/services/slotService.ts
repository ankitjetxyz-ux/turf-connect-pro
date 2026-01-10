import api from "@/services/api";

export interface TimeBlock {
  start: string;
  end: string;
  price: number;
  label?: string;
}

export interface BulkGenerateRequest {
  turf_id: string;
  start_date: string;
  end_date: string;
  active_days: string[];
  time_blocks: TimeBlock[];
  slot_duration: number;
  conflict_strategy: 'skip' | 'overwrite' | 'fill_gaps';
  save_template?: boolean;
  template_name?: string;
}

export interface Slot {
  id: number;
  turf_id: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  status: string;
  label?: string;
  is_booked: boolean;
}

export const slotService = {
  // Get slots for a turf
  getSlotsByTurf: (turfId: string, params?: { date?: string; start_date?: string; end_date?: string; status?: string }) => {
    return api.get(`/slots/${turfId}`, { params });
  },

  // Create single slot
  createSlot: (data: Partial<Slot>) => {
    return api.post('/slots', data);
  },

  // Update slot
  updateSlot: (id: number, data: Partial<Slot>) => {
    return api.put(`/slots/${id}`, data);
  },

  // Delete slot
  deleteSlot: (id: number) => {
    return api.delete(`/slots/${id}`);
  },

  // Bulk generate slots
  bulkGenerateSlots: (data: BulkGenerateRequest) => {
    return api.post('/slots/bulk/generate', data);
  },

  // Bulk update slots
  bulkUpdateSlots: (data: { turf_id: string; updates: Partial<Slot>; filters?: any }) => {
    return api.patch('/slots/bulk/update', data);
  },

  // Bulk delete slots
  bulkDeleteSlots: (data: { turf_id: string; filters?: any }) => {
    return api.post('/slots/bulk/delete', data);
  },

  // Get calendar view
  getCalendarView: (turfId: string, startDate: string, endDate: string) => {
    return api.get(`/slots/calendar/${turfId}`, {
      params: { start_date: startDate, end_date: endDate }
    });
  },

  // Get templates
  getTemplates: (turfId: string) => {
    return api.get('/slots/templates/list', { params: { turf_id: turfId } });
  },

  // Apply template
  applyTemplate: (data: { template_id: string; start_date: string; end_date: string }) => {
    return api.post('/slots/templates/apply', data);
  }
};

export const getSlotsByTurf = slotService.getSlotsByTurf;
export const createSlot = slotService.createSlot;
