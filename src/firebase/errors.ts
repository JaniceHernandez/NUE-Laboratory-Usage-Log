export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    super(`Missing or insufficient permissions for ${context.operation} at ${context.path}`);
    this.name = 'FirestorePermissionError';
    this.context = context;
    // Ensure properties are visible in console.log
    Object.defineProperty(this, 'context', { enumerable: true });
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}
