export function getGrade(marks) {
  if (marks >= 90) return { grade: 'A+', points: 10 }
  if (marks >= 80) return { grade: 'A', points: 9 }
  if (marks >= 70) return { grade: 'B', points: 8 }
  if (marks >= 60) return { grade: 'C', points: 7 }
  if (marks >= 50) return { grade: 'D', points: 6 }
  return { grade: 'F', points: 0 }
}
