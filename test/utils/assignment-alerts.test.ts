import { describe, it, expect } from 'vitest';
import { getAssignmentAlertLevel, AlertLevel } from '../../src/utils/assignment-alerts';
import { SoldierAssignment } from '../../src/types/soldier-assignment';

describe('Assignment Alerts', () => {
  const testDate = new Date('2024-01-15');
  
  const createAssignment = (
    startTime: string, 
    endTime: string, 
    positionId = 'pos1', 
    date = testDate
  ): SoldierAssignment => ({
    positionId,
    positionName: 'Test Position',
    shiftId: `shift_${startTime}_${endTime}`,
    startTime: startTime as any,
    endTime: endTime as any,
    assignmentIndex: 0,
    date
  });

  it('should return none for single assignment', () => {
    const assignments = [createAssignment('14:00', '18:00')];
    expect(getAssignmentAlertLevel(assignments)).toBe('none');
  });

  it('should return none for no assignments', () => {
    expect(getAssignmentAlertLevel([])).toBe('none');
  });

  it('should return red alert for parallel/overlapping shifts', () => {
    const assignments = [
      createAssignment('14:00', '22:00'),
      createAssignment('14:00', '18:00') // Starts at same time
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe('red');
  });

  it('should return red alert for partially overlapping shifts', () => {
    const assignments = [
      createAssignment('14:00', '18:00'),
      createAssignment('16:00', '20:00') // Overlaps 16:00-18:00
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe('red');
  });

  it('should return orange alert when gap equals first shift duration', () => {
    const assignments = [
      createAssignment('14:00', '18:00'), // 4 hours duration
      createAssignment('22:00', '02:00') // Gap = 4 hours (18:00-22:00)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe('orange');
  });

  it('should return orange alert when gap is less than first shift duration', () => {
    const assignments = [
      createAssignment('14:00', '18:00'), // 4 hours duration
      createAssignment('20:00', '22:00') // Gap = 2 hours (18:00-20:00)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe('orange');
  });

  it('should return yellow alert when gap is less than twice first shift duration', () => {
    const assignments = [
      createAssignment('14:00', '18:00'), // 4 hours duration
      createAssignment('24:00', '02:00') // Gap = 6 hours (less than 8 hours = 2x duration)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe('yellow');
  });

  it('should return none when gap is more than twice first shift duration', () => {
    const assignments = [
      createAssignment('14:00', '18:00'), // 4 hours duration
      createAssignment('02:00', '06:00') // Gap = 10 hours (more than 8 hours = 2x duration)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe('none');
  });

  it('should handle shifts crossing midnight', () => {
    const assignments = [
      createAssignment('22:00', '02:00'), // 4 hours duration, crosses midnight
      createAssignment('04:00', '08:00') // Gap = 2 hours (02:00-04:00)
    ];
    // Since shifts are sorted by start time, 04:00-08:00 will come first
    // But we need to check the gap between them when they're in chronological order
    // The 22:00-02:00 shift ends at 02:00, and 04:00-08:00 starts at 04:00
    // Gap = 2 hours, Duration of 22:00-02:00 = 4 hours
    // Since gap (2h) < duration (4h), this should be orange
    expect(getAssignmentAlertLevel(assignments)).toBe('orange');
  });

  it('should only consider assignments on the same date', () => {
    const assignments = [
      createAssignment('14:00', '18:00', 'pos1', testDate),
      createAssignment('16:00', '20:00', 'pos2', new Date('2024-01-16')) // Different date
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe('none');
  });

  it('should return highest priority alert when multiple alerts exist', () => {
    const assignments = [
      createAssignment('08:00', '12:00'), // First shift
      createAssignment('14:00', '18:00'), // Gap = 2 hours (would be orange)
      createAssignment('16:00', '20:00')  // Overlaps with second shift (red alert)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe('red');
  });

  it('should handle multiple consecutive shifts with orange taking priority over yellow', () => {
    const assignments = [
      createAssignment('08:00', '12:00'), // 4 hours
      createAssignment('18:00', '22:00'), // Gap = 6 hours (yellow alert - less than 8)
      createAssignment('24:00', '04:00')  // Gap = 2 hours (orange alert - less than 4)
    ];
    expect(getAssignmentAlertLevel(assignments)).toBe('orange');
  });

  it('should trigger orange alert for 14:00-22:00 and 02:00-06:00 case (user reported bug)', () => {
    const assignments = [
      createAssignment('14:00', '22:00'), // 8 hours duration (14:00-22:00)
      createAssignment('02:00', '06:00')  // 4 hours duration (02:00-06:00)
    ];
    // Gap between 22:00 and 02:00 = 4 hours
    // Since gap (4h) <= duration of first shift (8h), this should be orange
    expect(getAssignmentAlertLevel(assignments)).toBe('orange');
  });

  it('should trigger orange alert for consecutive shifts with gap = 0 (02:00-06:00 and 06:00-10:00)', () => {
    const assignments = [
      createAssignment('02:00', '06:00'), // 4 hours duration
      createAssignment('06:00', '10:00')  // 4 hours duration, starts exactly when first ends
    ];
    // Gap = 0 hours (consecutive shifts)
    // Since gap (0h) <= duration of first shift (4h), this should be orange
    expect(getAssignmentAlertLevel(assignments)).toBe('orange');
  });
}); 