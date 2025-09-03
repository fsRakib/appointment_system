// Event system for real-time updates
type EventCallback = (...args: unknown[]) => void;

class AppEventEmitter {
  private events: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event: string, data?: unknown) {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => callback(data));
  }
}

export const eventBus = new AppEventEmitter();

// Event types
export const EVENTS = {
  DOCTOR_REGISTERED: "doctor_registered",
  USER_REGISTERED: "user_registered",
  APPOINTMENT_CREATED: "appointment_created",
};
