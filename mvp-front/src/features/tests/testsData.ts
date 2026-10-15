export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const TESTS_DATA: Record<string, Question[][]> = {
  Python: [
    [
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
        question: 'Чему равно выражение 2 ** 3?',
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
        options: ['Сравнивает значения', 'Сравнивает id объектов в памяти', 'Проверяет тип'],
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

    [
      {
        id: 1,
        question: 'Как создать пустое множество (set)?',
        options: ['{}', 'set()', '[]'],
        correctAnswer: 1,
      },
      {
        id: 2,
        question: 'Что вернёт срез "hello"[1:3]?',
        options: ['"el"', '"ell"', '"he"'],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'Какой метод словаря возвращает значение по ключу с дефолтом?',
        options: ['find()', 'get()', 'lookup()'],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: 'Что вернёт list(reversed([1, 2, 3]))?',
        options: ['[3, 2, 1]', '[1, 2, 3]', 'None'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Как развернуть список arr на месте (in-place)?',
        options: ['arr.reverse()', 'reversed(arr)', 'arr[::-1]'],
        correctAnswer: 0,
      },
      {
        id: 6,
        question: 'Могут ли элементы словаря (ключи) быть списками?',
        options: ['Да', 'Нет, ключи должны быть хешируемыми', 'Только если список пустой'],
        correctAnswer: 1,
      },
      {
        id: 7,
        question: 'Что вернёт expression: [x * 2 for x in [1, 2]]?',
        options: ['[2, 4]', '[1, 2, 1, 2]', '[2, 2]'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Какой метод удаляет и возвращает последний элемент списка?',
        options: ['shift()', 'pop()', 'remove()'],
        correctAnswer: 1,
      },
      {
        id: 9,
        question: 'Что вернёт len(set([1, 2, 2, 3, 3]))?',
        options: ['5', '3', '2'],
        correctAnswer: 1,
      },
      {
        id: 10,
        question: 'Что делает метод str.strip()?',
        options: ['Удаляет пробелы по краям', 'Разделяет строку', 'Переводит в нижний регистр'],
        correctAnswer: 0,
      },
    ],

    [
      {
        id: 1,
        question: 'Какое ключевое слово создаёт анонимную функцию?',
        options: ['def', 'anonymous', 'lambda'],
        correctAnswer: 2,
      },
      {
        id: 2,
        question: 'Как называется конструктор класса в Python?',
        options: ['__construct__', '__init__', '__new__'],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'Что передаётся первым аргументом в методы экземпляра класса?',
        options: ['this', 'self', 'cls'],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: 'Что означает синтаксис *args в сигнатуре функции?',
        options: ['Кортеж позиционных аргументов', 'Словарь именованных аргументов', 'Обязательный аргумент'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Какое ключевое слово используется для создания генератора?',
        options: ['generate', 'yield', 'return next'],
        correctAnswer: 1,
      },
      {
        id: 6,
        question: 'Что делает декоратор @staticmethod?',
        options: ['Не передаёт неявно self или cls в метод', 'Делает метод приватным', 'Кэширует результат'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Как вызвать метод родительского класса?',
        options: ['parent().method()', 'super().method()', 'this.super.method()'],
        correctAnswer: 1,
      },
      {
        id: 8,
        question: 'Что возвращает метод __str__ у объекта?',
        options: ['Строковое представление для пользователя', 'Хеш объекта', 'Тип объекта'],
        correctAnswer: 0,
      },
      {
        id: 9,
        question: 'Что произойдёт при вызове функции без обязательного аргумента?',
        options: ['Аргумент станет None', 'TypeError', 'ValueError'],
        correctAnswer: 1,
      },
      {
        id: 10,
        question: 'Где определяются переменные уровня класса?',
        options: ['Внутри конструктора __init__', 'В теле класса вне методов', 'В модуле'],
        correctAnswer: 1,
      },
    ],

    [
      {
        id: 1,
        question: 'Для чего используется менеджер контекста `with`?',
        options: ['Гарантированное освобождение ресурсов (__enter__/__exit__)', 'Ускорение выполнения цикла', 'Создание потока'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Что такое GIL в CPython?',
        options: ['Global Interpreter Lock', 'General Interface Library', 'Global Iteration Loop'],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'Чем отличается `is` от `==`?',
        options: ['`is` сравнивает адреса в памяти, `==` — значения', 'Нет различий', '`is` быстрее сравнивает строки'],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'Что возвращает функция `zip([1, 2], [3, 4])`?',
        options: ['Итератор пар (1, 3), (2, 4)', '[1, 2, 3, 4]', 'Словарь {1: 3, 2: 4}'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Что произойдёт при: a = [[]] * 3; a[0].append(1)?',
        options: ['a станет [[1], [], []]', 'a станет [[1], [1], [1]]', 'Ошибка IndexError'],
        correctAnswer: 1,
      },
      {
        id: 6,
        question: 'Какой тип возвращает функция any([0, False, 5])?',
        options: ['int', 'bool (True)', 'bool (False)'],
        correctAnswer: 1,
      },
      {
        id: 7,
        question: 'Что делает модуль `copy.deepcopy()`?',
        options: ['Рекурсивно копирует объект и все вложенные структуры', 'Создаёт поверхностную копию', 'Удаляет объект'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Что делает конструкция `else` в блоке `try...except`?',
        options: ['Выполняется всегда', 'Выполняется, если не возникло исключение', 'Выполняется при любой ошибке'],
        correctAnswer: 1,
      },
      {
        id: 9,
        question: 'Какая сложность поиска по ключу в dict в среднем?',
        options: ['O(1)', 'O(n)', 'O(log n)'],
        correctAnswer: 0,
      },
      {
        id: 10,
        question: 'Как объявить тип переменной (type hint) в Python 3.6+?',
        options: ['int x = 5', 'x: int = 5', 'var x as int = 5'],
        correctAnswer: 1,
      },
    ],

    [
      {
        id: 1,
        question: 'Какой модуль стандартной библиотеки используется для работы с JSON?',
        options: ['json', 'simplejson', 'serialize'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Что выведет print(type(1 / 1)) в Python 3?',
        options: ["<class 'int'>", "<class 'float'>", "<class 'double'>"],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'Что такое __slots__ в классе?',
        options: ['Ограничивает набор доступных атрибутов для оптимизации памяти', 'Список базовых классов', 'Служебный таймер'],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'Что произойдет, если в качестве значения по умолчанию в функции передать список: def f(l=[])?',
        options: ['Список будет общим между вызовами', 'Список создается заново каждый вызов', 'Будет синтаксическая ошибка'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Что делает метод dict.setdefault(key, default)?',
        options: ['Возвращает значение или устанавливает default, если ключа нет', 'Сбрасывает словарь', 'Удаляет ключ'],
        correctAnswer: 0,
      },
      {
        id: 6,
        question: 'Как проверить, что объект является экземпляром класса или его наследника?',
        options: ['type(obj) == Cls', 'isinstance(obj, Cls)', 'obj is Cls'],
        correctAnswer: 1,
      },
      {
        id: 7,
        question: 'Что вернет all([])?',
        options: ['True', 'False', 'None'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Какая структура данных лежит в основе модуля collections.deque?',
        options: ['Двусвязный список', 'Динамический массив', 'Бинарное дерево'],
        correctAnswer: 0,
      },
      {
        id: 9,
        question: 'Какой модуль используется для работы со случайными числами?',
        options: ['math', 'random', 'numbers'],
        correctAnswer: 1,
      },
      {
        id: 10,
        question: 'Что делает инструкция pass?',
        options: ['Завершает программу', 'Пустая операция-заглушка', 'Пропускает текущую итерацию цикла'],
        correctAnswer: 1,
      },
    ],
  ],

  Java: [
    [
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
        options: ['Делает значение неизменяемым после инициализации', 'Удаляет переменную', 'Делает поле публичным'],
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
        options: ['В Stack', 'В Heap (куче)', 'В регистре'],
        correctAnswer: 1,
      },
    ],

    [
      {
        id: 1,
        question: 'Сколько классов можно унаследовать одновременно через extends?',
        options: ['Только один', 'Сколько угодно', 'До трех'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Может ли интерфейс содержать реализацию метода начиная с Java 8?',
        options: ['Нет', 'Да, с помощью ключевого слова default', 'Только приватные'],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'Какой спецификатор делает поле видимым только внутри своего пакета и наследникам?',
        options: ['private', 'protected', 'default (package-private)'],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: 'Что происходит при вызове super() в конструкторе?',
        options: ['Вызов конструктора родительского класса', 'Создание статического контекста', 'Уничтожение объекта'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Можно ли создать экземпляр абстрактного класса через new?',
        options: ['Да', 'Нет', 'Только если он public'],
        correctAnswer: 1,
      },
      {
        id: 6,
        question: 'Какая аннотация указывает на переопределение метода родителя?',
        options: ['@Override', '@Overload', '@Inherited'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Какой класс является базовым для всех классов в Java?',
        options: ['java.lang.Class', 'java.lang.Object', 'java.lang.Root'],
        correctAnswer: 1,
      },
      {
        id: 8,
        question: 'Что означает ключевое слово static у метода?',
        options: ['Метод принадлежит классу, а не объекту', 'Метод нельзя изменить', 'Метод запускается в отдельном потоке'],
        correctAnswer: 0,
      },
      {
        id: 9,
        question: 'Что будет при переопределении метода с уменьшением его видимости (например с public на private)?',
        options: ['Ошибка компиляции', 'Предупреждение', 'Метод скроется'],
        correctAnswer: 0,
      },
      {
        id: 10,
        question: 'Что произойдет, если класс объявлен с модификатором final?',
        options: ['От него нельзя наследоваться', 'Нельзя создать объект', 'Все его методы статические'],
        correctAnswer: 0,
      },
    ],

    [
      {
        id: 1,
        question: 'В чем ключевое отличие ArrayList от LinkedList?',
        options: ['ArrayList на основе массива, LinkedList на двусвязном списке', 'LinkedList не допускает дубликаты', 'ArrayList синхронизирован'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Гарантирует ли HashSet порядок вставки элементов?',
        options: ['Да', 'Нет', 'Да, если элементы — числа'],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'Какая реализация Map сохраняет порядок вставки элементов?',
        options: ['HashMap', 'TreeMap', 'LinkedHashMap'],
        correctAnswer: 2,
      },
      {
        id: 4,
        question: 'Какая реализация Set сортирует элементы в натуральном порядке?',
        options: ['TreeSet', 'HashSet', 'LinkedHashSet'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Что такое Type Erasure (стирание типов) в Java Generics?',
        options: ['Информация о типах удаляется во время компиляции', 'Типы удаляются JVM в рантайме', 'Запрет на использование Object'],
        correctAnswer: 0,
      },
      {
        id: 6,
        question: 'Какой контракт существует между equals() и hashCode()?',
        options: ['Если объекты равны по equals, их hashCode обязаны совпадать', 'Если hashCode равны, объекты равны по equals', 'Связи нет'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Что возвращает метод map.put(key, value), если ключ уже присутствовал?',
        options: ['Предыдущее значение', 'null', 'Новое значение'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Является ли ArrayList потокобезопасным (thread-safe)?',
        options: ['Да', 'Нет', 'Только при чтении'],
        correctAnswer: 1,
      },
      {
        id: 9,
        question: 'Какая сложность получения элемента по индексу в ArrayList?',
        options: ['O(1)', 'O(n)', 'O(log n)'],
        correctAnswer: 0,
      },
      {
        id: 10,
        question: 'Какая структура данных лежит в основе PriorityQueue?',
        options: ['Двоичная куча (Binary Heap)', 'Хеш-таблица', 'Стек'],
        correctAnswer: 0,
      },
    ],

    [
      {
        id: 1,
        question: 'Что является прямым предком всех исключений и ошибок в Java?',
        options: ['java.lang.Throwable', 'java.lang.Exception', 'java.lang.Error'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'К какому типу исключений относится NullPointerException?',
        options: ['Checked (проверяемое)', 'Unchecked (непроверяемое / RuntimeException)', 'Error'],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'Выполнится ли блок finally, если в блоке try сработал return?',
        options: ['Да', 'Нет', 'Зависит от JVM'],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'В каком случае блок finally НЕ выполнится?',
        options: ['При вызове System.exit(0)', 'При возникновении OutOfMemoryError', 'При бесконечном цикле в catch'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Что делает конструкция try-with-resources?',
        options: ['Автоматически закрывает AutoCloseable ресурсы', 'Выделяет память в Stack', 'Перехватывает все Error'],
        correctAnswer: 0,
      },
      {
        id: 6,
        question: 'Где хранятся локальные примитивные переменные метода?',
        options: ['В Stack', 'В Heap', 'В Metaspace'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Что делает сборщик мусора (Garbage Collector)?',
        options: ['Очищает память объектов, на которые больше нет сильных ссылок', 'Дефрагментирует жесткий диск', 'Удаляет неиспользуемые классы сразу'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Что такое String Pool?',
        options: ['Специальная область памяти в Heap для хранения уникальных литералов строк', 'Пул потоков для String', 'Буфер вывода'],
        correctAnswer: 0,
      },
      {
        id: 9,
        question: 'Что делает метод intern() у объекта String?',
        options: ['Помещает строку в String Pool и возвращает каноническое представление', 'Переводит строку в байты', 'Делает строку изменяемой'],
        correctAnswer: 0,
      },
      {
        id: 10,
        question: 'Чем StringBuilder отличается от StringBuffer?',
        options: ['StringBuilder быстрее, но не потокобезопасен', 'StringBuffer не изменяем', 'Нет различий'],
        correctAnswer: 0,
      },
    ],

    [
      {
        id: 1,
        question: 'Какой интерфейс представляет задачу, возвращающую результат и способную бросить Exception?',
        options: ['Runnable', 'Callable', 'Thread'],
        correctAnswer: 1,
      },
      {
        id: 2,
        question: 'Что гарантирует ключевое слово volatile для переменной?',
        options: ['Видимость изменений всеми потоками и запрет переупорядочивания инструкций', 'Атомарность операций инкремента', 'Блокировку потока'],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'Какое ключевое слово используется для захвата монитора объекта?',
        options: ['lock', 'synchronized', 'atomic'],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: 'Что возвращает метод Stream.map()?',
        options: ['Новый Stream с преобразованными элементами', 'Коллекцию Map', 'Терминальный результат'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Является ли операция `Stream.forEach()` промежуточной или терминальной?',
        options: ['Терминальной', 'Промежуточной', 'Зависит от параметров'],
        correctAnswer: 0,
      },
      {
        id: 6,
        question: 'Для чего предназначен класс Optional в Java 8+?',
        options: ['Для предотвращения NullPointerException и явного обозначения отсутствия значения', 'Для ускорения сериализации', 'Для работы с потоками'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Что такое record в Java (начиная с Java 14/16)?',
        options: ['Неизменяемый класс-носитель данных с автогенерацией геттеров, equals и hashCode', 'Новый тип базы данных', 'Интерфейс логирования'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Что произойдет при вызове `thread.run()` вместо `thread.start()`?',
        options: ['Код метода выполнится в текущем потоке, новый поток не создастся', 'Выбросится исключение', 'Создастся фоновый поток'],
        correctAnswer: 0,
      },
      {
        id: 9,
        question: 'Какой пул потоков возвращает Executors.newFixedThreadPool(n)?',
        options: ['Пул с фиксированным количеством рабочих потоков', 'Пул, растущий бесконечно', 'Пул с одним потоком'],
        correctAnswer: 0,
      },
      {
        id: 10,
        question: 'Что делает метод CompletableFuture.supplyAsync()?',
        options: ['Асинхронно выполняет задачу в ForkJoinPool и возвращает результат', 'Блокирует текущий поток', 'Создает поток-демон'],
        correctAnswer: 0,
      },
    ],
  ],

  'C++': [

    [
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
        question: 'Что означает символ & перед именем переменной при её объявлении (например int& ref)?',
        options: ['Объявление ссылки', 'Взятие адреса', 'Побитовое И'],
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
        options: ['virtual void f() = 0;', 'abstract void f();', 'virtual void f() empty;'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Что делает ключевое слово nullptr в C++11?',
        options: ['Типобезопасный нулевой указатель типа std::nullptr_t', 'Обнуляет память массива', 'Освобождает указатель'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Какая область видимости у членов класса (class) по умолчанию?',
        options: ['public', 'private', 'protected'],
        correctAnswer: 1,
      },
      {
        id: 9,
        question: 'Какой умный указатель запрещает копирование и владеет объектом монопольно?',
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

    [
      {
        id: 1,
        question: 'Может ли ссылка (reference) быть неинициализированной?',
        options: ['Нет, ссылка должна быть привязана к объекту при создании', 'Да', 'Только внутри функций'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Что разыменовывает оператор `*ptr`?',
        options: ['Получает значение по адресу, на который указывает указатель', 'Умножает значение адреса', 'Освобождает память'],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'Что означает const в конце сигнатуры метода: void print() const?',
        options: ['Метод не может изменять не-mutable поля класса', 'Метод возвращает константу', 'Метод статический'],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'Что происходит при вызове delete для указателя со значением nullptr?',
        options: ['Ничего, это безопасная операция', 'Undefined Behavior', 'Аварийное завершение'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Каков результат арифметики указателей: ptr + 1 для int*?',
        options: ['Адрес смещается на sizeof(int) байт', 'Адрес увеличивается ровно на 1 байт', 'Указатель становится невалидным'],
        correctAnswer: 0,
      },
      {
        id: 6,
        question: 'Что такое inline функция?',
        options: ['Подсказка компилятору встроить код функции в место вызова', 'Функция без тела', 'Функция из одной строки'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Что делает оператор static_cast?',
        options: ['Выполняет явное приведение типов на этапе компиляции', 'Приводит типы в рантайме с проверкой RTTI', 'Снимает const'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Какая разница между malloc/free и new/delete?',
        options: ['new/delete вызывают конструкторы и деструкторы объектов', 'malloc работает быстрее new', 'Разницы нет'],
        correctAnswer: 0,
      },
      {
        id: 9,
        question: 'Что такое dangling pointer (висячий указатель)?',
        options: ['Указатель, указывающий на уже освобожденную память', 'Указатель со значением nullptr', 'Указатель на константу'],
        correctAnswer: 0,
      },
      {
        id: 10,
        question: 'Что делает спецификатор extern?',
        options: ['Объявляет идентификатор, определенный в другой единице трансляции', 'Делает переменную локальной', 'Запрещает экспорт'],
        correctAnswer: 0,
      },
    ],

    [
      {
        id: 1,
        question: 'Зачем базовому классу нужен виртуальный деструктор?',
        options: ['Для корректного удаления объектов производных классов через указатель на базовый', 'Для ускорения деструктора', 'Это обязательное требование стандарта'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Что такое vtable (таблица виртуальных методов)?',
        options: ['Механизм динамической диспетчеризации виртуальных функций', 'Список полей класса', 'Хеш-таблица классов'],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'Что делает спецификатор override в C++11?',
        options: ['Проверяет на этапе компиляции, что метод действительно переопределяет виртуальный метод базового класса', 'Заменяет метод родителя', 'Делает метод публичным'],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'Что означает спецификатор final у виртуального метода?',
        options: ['Запрещает дальнейшее переопределение метода в наследниках', 'Запрещает вызов метода', 'Делает метод константным'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Что такое ромбовидное наследование (diamond problem)?',
        options: ['Неоднозначность, когда класс наследует два класса с общим предком', 'Наследование 4-х интерфейсов', 'Ошибка линковщика'],
        correctAnswer: 0,
      },
      {
        id: 6,
        question: 'Как решается проблема ромбовидного наследования в C++?',
        options: ['Виртуальным наследованием (virtual public Base)', 'Множественным включением', 'Использованием шаблонов'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Какое ключевое слово запрещает неявные преобразования типов в конструкторах с одним параметром?',
        options: ['explicit', 'noexcept', 'strict'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Что делает ключевое слово friend у функции по отношению к классу?',
        options: ['Дает функции доступ к private и protected членам этого класса', 'Делает функцию методом класса', 'Запрещает вызов функции'],
        correctAnswer: 0,
      },
      {
        id: 9,
        question: 'Что такое RAII (Resource Acquisition Is Initialization)?',
        options: ['Идиома захвата ресурсов в конструкторе и освобождения в деструкторе', 'Паттерн проектирования фабрики', 'Правило форматирования кода'],
        correctAnswer: 0,
      },
      {
        id: 10,
        question: 'Какое правило известно как "Правило трёх" (Rule of Three)?',
        options: ['Если объявлен деструктор, копирующий конструктор или копирующий оператор присваивания, нужно объявить все три', 'Класс должен иметь 3 конструктора', 'Функция не должна принимать больше 3 аргументов'],
        correctAnswer: 0,
      },
    ],

    [
      {
        id: 1,
        question: 'Что происходит при вызове vector::push_back, когда capacity исчерпан?',
        options: ['Выделяется новый блок памяти большего размера, элементы копируются/перемещаются', 'Выбрасывается ошибка', 'Элемент отбрасывается'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Какая сложность поиска по ключу в std::map?',
        options: ['O(log n)', 'O(1)', 'O(n)'],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'Какая структура данных используется внутри std::map?',
        options: ['Красно-черное дерево (сбалансированное бинарное дерево поиска)', 'Хеш-таблица', 'Массив'],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'Какая средняя сложность поиска в std::unordered_map?',
        options: ['O(1)', 'O(log n)', 'O(n)'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Чем std::array отличается от std::vector?',
        options: ['std::array имеет фиксированный размер, задаваемый на этапе компиляции', 'std::array размещается только в heap', 'std::array не поддерживает итераторы'],
        correctAnswer: 0,
      },
      {
        id: 6,
        question: 'Что делает алгоритм std::sort по умолчанию?',
        options: ['Сортирует элементы по возрастанию (через operator<)', 'Сортирует по убыванию', 'Удаляет дубликаты'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Что делает метод emplace_back у вектора?',
        options: ['Конструирует объект непосредственно в памяти вектора без лишнего копирования', 'Вставляет элемент в начало', 'Очищает вектор'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Инвалидируются ли итераторы std::list при вставке или удалении элементов?',
        options: ['Нет, кроме итератора на сам удаляемый элемент', 'Да, все итераторы инвалидируются', 'Инвалидируются только при вставке'],
        correctAnswer: 0,
      },
      {
        id: 9,
        question: 'Какой тип итераторов поддерживает std::vector?',
        options: ['Random Access Iterators (произвольного доступа)', 'Forward Iterators', 'Bidirectional only'],
        correctAnswer: 0,
      },
      {
        id: 10,
        question: 'Что возвращает метод map::find, если элемент не найден?',
        options: ['map::end()', 'nullptr', 'Вызывает исключение std::out_of_range'],
        correctAnswer: 0,
      },
    ],

    [
      {
        id: 1,
        question: 'Что делает функция std::move?',
        options: ['Безусловно приводит аргумент к rvalue-ссылке (T&&)', 'Физически перемещает память', 'Создает копию объекта'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Что решает std::weak_ptr?',
        options: ['Разрывает циклические ссылки у std::shared_ptr', 'Управляет массивом байт', 'Заменяет обычные сырые указатели'],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'Что означает спецификатор constexpr?',
        options: ['Значение или функция могут быть вычислены на этапе компиляции', 'Переменная потокобезопасна', 'Память не выделяется'],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'Что означает спецификатор noexcept у функции?',
        options: ['Обещание, что функция не выбрасывает исключений (иначе std::terminate)', 'Функция автоматически ловит все ошибки', 'Запрет возврата значения'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'Что выводит тип auto в: const int x = 10; auto y = x;?',
        options: ['int (const сбрасывается по значению)', 'const int', 'const int&'],
        correctAnswer: 0,
      },
      {
        id: 6,
        question: 'Что делает лямбда-выражение с захватом `[&]`?',
        options: ['Захватывает все используемые локальные переменные по ссылке', 'Захватывает по значению', 'Не захватывает ничего'],
        correctAnswer: 0,
      },
      {
        id: 7,
        question: 'Какой умный указатель следует использовать с функцией std::make_unique?',
        options: ['std::unique_ptr', 'std::shared_ptr', 'std::auto_ptr'],
        correctAnswer: 0,
      },
      {
        id: 8,
        question: 'Что представляет собой std::optional в C++17?',
        options: ['Обертка, которая может либо содержать значение, либо быть пустой (nullopt)', 'Умный указатель', 'Контейнер для ошибок'],
        correctAnswer: 0,
      },
      {
        id: 9,
        question: 'Для чего используется structured binding (структурное связывание) в C++17 (auto [a, b] = pair)?',
        options: ['Для удобной распаковки кортежей, пар и структур в отдельные переменные', 'Для создания связанных списков', 'Для приведения типов'],
        correctAnswer: 0,
      },
      {
        id: 10,
        question: 'Что появилось в стандарте C++20 для ограничения шаблонных параметров?',
        options: ['Concepts (Концепты)', 'Traits 2.0', 'Static Assert'],
        correctAnswer: 0,
      },
    ],
  ],
};