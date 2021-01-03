class ApllyErrorHandler {
  private hasError: boolean = false;
  private errors: any[] = [];
  public setAppleyError(ops: any[], error: any) {
    this.hasError = true;
    this.errors.push({ error, ops });
  }

  public getErrorInfos() {
    return this.errors;
  }

  public get IsAllApplySuccess() {
    return !this.hasError;
  }

  public reset() {
    this.hasError = false;
    this.errors = [];
  }
}

export const applyErrorHandler = new ApllyErrorHandler();
