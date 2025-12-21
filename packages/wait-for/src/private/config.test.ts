import { expect } from 'expect';
import { describe, test } from 'node:test';
import { getConfig } from './config.ts';

describe('getConfig', () => test('should work', () => expect(getConfig()).toBeTruthy()));
