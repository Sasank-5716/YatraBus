import { Pipe, PipeTransform } from '@angular/core';
import { dur, fmtDate, fmtLong, fmtStamp, gName, initials, npr, t12 } from '../../core/utils/format';

@Pipe({ name: 'npr' }) export class NprPipe implements PipeTransform { transform(v: unknown) { return npr(v); } }
@Pipe({ name: 'dur' }) export class DurPipe implements PipeTransform { transform(v: number) { return dur(v); } }
@Pipe({ name: 't12' }) export class T12Pipe implements PipeTransform { transform(v: string) { return t12(v); } }
@Pipe({ name: 'fmtDate' }) export class FmtDatePipe implements PipeTransform { transform(v: string, o?: Intl.DateTimeFormatOptions) { return fmtDate(v, o); } }
/** 'long' = medium date + short time; 'short' = short date + time (en-GB). */
@Pipe({ name: 'stamp' }) export class StampPipe implements PipeTransform { transform(v: string, kind: 'long' | 'short' = 'long') { return kind === 'long' ? fmtLong(v) : fmtStamp(v); } }
@Pipe({ name: 'initials' }) export class InitialsPipe implements PipeTransform { transform(v: string) { return initials(v); } }
@Pipe({ name: 'gender' }) export class GenderPipe implements PipeTransform { transform(v: string) { return gName(v); } }

export const FORMAT_PIPES = [NprPipe, DurPipe, T12Pipe, FmtDatePipe, StampPipe, InitialsPipe, GenderPipe] as const;
