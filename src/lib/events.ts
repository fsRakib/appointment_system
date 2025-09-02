// Event system for real-time updates
class AppEventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event: string, data?: any) {
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
