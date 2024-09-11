export class SchedulerError extends Error {
  
  private _metadata: Record<string, any> = {};

  constructor(message: string, metadata?: Record<string, any>) {
    super(message);
    if (metadata) {
      this._metadata = metadata;
    }
    this.name = "SchedulerError";
  }

  get metadata(): Record<string, any> {
    return this._metadata;
  }
}