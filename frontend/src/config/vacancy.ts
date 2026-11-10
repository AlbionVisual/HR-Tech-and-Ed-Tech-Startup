export type VacancyGrade = 'intern' | 'junior' | 'middle' | 'senior'

export type VacancyContext = {
  company: string
  grade: VacancyGrade
  description: string
}
