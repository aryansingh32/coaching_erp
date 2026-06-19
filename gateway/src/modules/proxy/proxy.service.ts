import { Injectable, ForbiddenException } from '@nestjs/common';
import { EducationAdapter } from '../../adapters/erpnext/education.adapter';
import { MoodleAdapter } from '../../adapters/moodle/moodle.adapter';

const BLOCKED_DOCTYPES = ['System Settings', 'User', 'Role', 'Module Def'];

@Injectable()
export class ProxyService {
  constructor(
    private readonly erpAdapter: EducationAdapter,
    private readonly moodleAdapter: MoodleAdapter,
  ) {}

  private guardDoctype(doctype: string) {
    if (BLOCKED_DOCTYPES.includes(doctype)) {
      throw new ForbiddenException(`Access to ${doctype} is restricted`);
    }
  }

  erpList(doctype: string, filters?: string, fields?: string) {
    this.guardDoctype(doctype);
    const parsedFilters = filters ? JSON.parse(filters) : undefined;
    const parsedFields = fields ? JSON.parse(fields) : ['*'];
    return this.erpAdapter.listDocs(doctype, parsedFilters, parsedFields);
  }

  erpGet(doctype: string, name: string) {
    this.guardDoctype(doctype);
    return this.erpAdapter.getDoc(doctype, name);
  }

  erpCreate(doctype: string, data: Record<string, unknown>) {
    this.guardDoctype(doctype);
    return this.erpAdapter.createDoc(doctype, data);
  }

  erpUpdate(doctype: string, name: string, data: Record<string, unknown>) {
    this.guardDoctype(doctype);
    return this.erpAdapter.updateDoc(doctype, name, data);
  }

  erpCallMethod(method: string, data: Record<string, unknown>) {
    if (method.includes('install') || method.includes('delete')) {
      throw new ForbiddenException('Method not allowed');
    }
    return this.erpAdapter.callMethod(method, data);
  }

  moodleCall(wsFunction: string, params: Record<string, unknown>) {
    return this.moodleAdapter.call(wsFunction, params);
  }
}
