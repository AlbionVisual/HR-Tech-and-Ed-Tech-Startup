export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // индекс правильного ответа (начиная с 0)
}

export const TESTS_DATA: Record<string, Question[]> = {
  Python: [
    {
      id: 1,
      question: 'Как объявить функцию в Python?',
      options: ['def f():', 'function f()', 'fn f()'],
      correctAnswer: 0,
    },
    {
      id: 2,
      question: 'Чему равно len([1, 2, 3])?',
      options: ['2', '3', '4'],
      correctAnswer: 1,
    },
    {
      id: 3,
      question: 'Чему равно выражение 2**3?',
      options: ['6', '8', '9'],
      correctAnswer: 1,
    },
    {
      id: 4,
      question: 'Какой тип данных является изменяемым (mutable)?',
      options: ['tuple', 'list', 'str'],
      correctAnswer: 1,
    },
    {
      id: 5,
      question: 'Как получить последний элемент списка arr?',
      options: ['arr[last]', 'arr[end]', 'arr[-1]'],
      correctAnswer: 2,
    },
    {
      id: 6,
      question: 'Что вернёт bool([])?',
      options: ['True', 'False', 'None'],
      correctAnswer: 1,
    },
    {
      id: 7,
      question: 'Какой метод добавляет элемент в конец списка?',
      options: ['append()', 'push()', 'add()'],
      correctAnswer: 0,
    },
    {
      id: 8,
      question: 'Что делает оператор is в Python?',
      options: [
        'Сравнивает значения',
        'Сравнивает id объектов в памяти',
        'Проверяет принадлежность к типу',
      ],
      correctAnswer: 1,
    },
    {
      id: 9,
      question: 'Как правильно обработать исключение?',
      options: ['try ... catch', 'try ... except', 'do ... error'],
      correctAnswer: 1,
    },
    {
      id: 10,
      question: 'Что возвращает функция range(3)?',
      options: ['[1, 2, 3]', '[0, 1, 2, 3]', 'Последовательность 0, 1, 2'],
      correctAnswer: 2,
    },
  ],

  Java: [
    {
      id: 1,
      question: 'Какое ключевое слово используется для наследования класса?',
      options: ['implements', 'extends', 'inherits'],
      correctAnswer: 1,
    },
    {
      id: 2,
      question: 'Какой размер имеет тип данных int в Java?',
      options: ['16 бит', '32 бита', '64 бита'],
      correctAnswer: 1,
    },
    {
      id: 3,
      question: 'Какое значение по умолчанию у boolean поля класса?',
      options: ['null', 'true', 'false'],
      correctAnswer: 2,
    },
    {
      id: 4,
      question: 'Что из этого НЕ является примитивным типом?',
      options: ['String', 'char', 'float'],
      correctAnswer: 0,
    },
    {
      id: 5,
      question: 'Какой метод является точкой входа в Java-программу?',
      options: ['start()', 'main()', 'init()'],
      correctAnswer: 1,
    },
    {
      id: 6,
      question: 'Какой интерфейс реализуют структуры List и Set?',
      options: ['Collection', 'IterableCollection', 'Map'],
      correctAnswer: 0,
    },
    {
      id: 7,
      question: 'Что делает ключевое слово final для переменной?',
      options: [
        'Делает значение неизменяемым',
        'Удаляет переменную из памяти',
        'Делает переменную публичной',
      ],
      correctAnswer: 0,
    },
    {
      id: 8,
      question: 'Как правильно сравнить строки по содержимому?',
      options: ['str1 == str2', 'str1.equals(str2)', 'str1.isSame(str2)'],
      correctAnswer: 1,
    },
    {
      id: 9,
      question: 'Какая структура данных хранит пары «ключ-значение»?',
      options: ['ArrayList', 'HashMap', 'HashSet'],
      correctAnswer: 1,
    },
    {
      id: 10,
      question: 'Где создаются объекты (через new) в памяти Java?',
      options: ['В Stack', 'В Heap (куче)', 'В регистре процессора'],
      correctAnswer: 1,
    },
  ],

  'C++': [
    {
      id: 1,
      question: 'Какой оператор выделяет динамическую память в С++?',
      options: ['malloc', 'new', 'alloc'],
      correctAnswer: 1,
    },
    {
      id: 2,
      question: 'Какой спецификатор доступа действует в struct по умолчанию?',
      options: ['public', 'private', 'protected'],
      correctAnswer: 0,
    },
    {
      id: 3,
      question: 'Какой оператор используется для освобождения памяти после new[]?',
      options: ['free', 'delete', 'delete[]'],
      correctAnswer: 2,
    },
    {
      id: 4,
      question: 'Что означает символ & перед именем переменной?',
      options: ['Взятие адреса', 'Разыменование', 'Логическое И'],
      correctAnswer: 0,
    },
    {
      id: 5,
      question: 'Какая библиотека STL предоставляет динамический массив?',
      options: ['std::list', 'std::vector', 'std::array'],
      correctAnswer: 1,
    },
    {
      id: 6,
      question: 'Как объявить чисто виртуальную функцию в базовом классе?',
      options: [
        'virtual void f() = 0;',
        'abstract void f();',
        'virtual void f() empty;',
      ],
      correctAnswer: 0,
    },
    {
      id: 7,
      question: 'Что делает оператор nullptr в C++11?',
      options: [
        'Является нулевым указателем безопасного типа',
        'Обнуляет массив',
        'Освобождает указатель',
      ],
      correctAnswer: 0,
    },
    {
      id: 8,
      question: 'Какая область видимости у класса (class) по умолчанию?',
      options: ['public', 'private', 'protected'],
      correctAnswer: 1,
    },
    {
      id: 9,
      question: 'Какой умный указатель (smart pointer) запрещает копирование?',
      options: ['std::shared_ptr', 'std::unique_ptr', 'std::weak_ptr'],
      correctAnswer: 1,
    },
    {
      id: 10,
      question: 'Что вернет sizeof(char) по стандарту C++?',
      options: ['1', '2', 'Зависит от архитектуры'],
      correctAnswer: 0,
    },
  ],
};