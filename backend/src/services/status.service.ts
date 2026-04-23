import { EventEmitter } from 'events';

class StatusService extends EventEmitter {
    public publish(requestId: string, message: string) {
        this.emit(`status:${requestId}`, message);
    }
}

export const statusService = new StatusService();
