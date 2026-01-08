import { Snippet } from "@/types/typing-test";

export const snippets: Snippet[] = [
  // --- JavaScript ---
  {
    id: 'js-bubble-sort',
    language: 'javascript',
    description: 'Bubble Sort implementation',
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`
  },
  {
      id: 'js-promise-all',
      language: 'javascript',
      description: 'Promise.all with async/await',
      code: `async function fetchAllData(urls) {
  try {
    const promises = urls.map(url => fetch(url).then(r => r.json()));
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    throw error;
  }
}`
  },

  // --- TypeScript ---
  {
    id: 'ts-interface',
    language: 'typescript',
    description: 'Interface and Class implementation',
    code: `interface User {
  id: number;
  name: string;
  email: string;
}

class UserManager {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }
}`
  },
  {
      id: 'ts-generics',
      language: 'typescript',
      description: 'Generics with Constraints',
      code: `interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

const result = loggingIdentity({ length: 10, value: 3 });`
  },

  // --- Python ---
  {
    id: 'py-binary-search',
    language: 'python',
    description: 'Binary Search Algorithm',
    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        guess = arr[mid]
        if guess == target:
            return mid
        if guess > target:
            high = mid - 1
        else:
            low = mid + 1
    return None`
  },
  {
      id: 'py-list-comp',
      language: 'python',
      description: 'List Comprehensions & Decorators',
      code: `@time_execution
def process_numbers(numbers):
    evens = [n for n in numbers if n % 2 == 0]
    squared = [n ** 2 for n in evens]
    return sum(squared)

def generator_example():
    yield from range(10)`
  },

  // --- C++ ---
  {
    id: 'cpp-vector',
    language: 'cpp',
    description: 'Vector and Iterators',
    code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    
    for (const auto& num : numbers) {
        std::cout << num << " ";
    }
    
    // Using iterator
    for (auto it = numbers.begin(); it != numbers.end(); ++it) {
        *it *= 2;
    }
    
    return 0;
}`
  },

  // --- Java ---
  {
      id: 'java-stream',
      language: 'java',
      description: 'Stream API Filtering',
      code: `import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class StreamExample {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
        
        List<String> filtered = names.stream()
            .filter(n -> n.startsWith("A"))
            .map(String::toUpperCase)
            .collect(Collectors.toList());
            
        System.out.println(filtered);
    }
}`
  },

  // --- Go ---
  {
      id: 'go-concurrency',
      language: 'go',
      description: 'Goroutines and Channels',
      code: `package main

import "fmt"

func sum(s []int, c chan int) {
	sum := 0
	for _, v := range s {
		sum += v
	}
	c <- sum
}

func main() {
	s := []int{7, 2, 8, -9, 4, 0}
	c := make(chan int)
	go sum(s[:len(s)/2], c)
	go sum(s[len(s)/2:], c)
	x, y := <-c, <-c
	fmt.Println(x, y, x+y)
}
`
  },

  // --- Rust --- 
  {
      id: 'rust-ownership',
      language: 'rust',
      description: 'Ownership and Borrowing',
      code: `fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s goes out of scope, but it refers to s1 value which is not dropped`
  },

  // --- SQL ---
  {
      id: 'sql-joins',
      language: 'sql',
      description: 'Complex Join and Group By',
      code: `SELECT 
    d.department_name,
    COUNT(e.employee_id) as emp_count,
    AVG(e.salary) as avg_salary
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id
WHERE d.active = true
GROUP BY d.department_name
HAVING AVG(e.salary) > 50000
ORDER BY emp_count DESC;`
  },

  // --- HTML ---
  {
      id: 'html-semantic',
      language: 'html',
      description: 'Semantic HTML5 Layout',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Semantic Page</title>
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <article>
            <h1>Main Article</h1>
            <p>Content goes here.</p>
        </article>
    </main>
    <footer>
        <p>&copy; 2024 Company Name</p>
    </footer>
</body>
</html>`
  },
  {
      id: 'html-form',
      language: 'html',
      description: 'Accessible Form',
      code: `<form action="/submit" method="post">
    <div class="form-group">
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required aria-describedby="user-hint">
        <span id="user-hint" class="hint">Must be unique</span>
    </div>

    <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
    </div>

    <button type="submit">Register</button>
</form>`
  },

  // --- CSS ---
  {
      id: 'css-flexbox',
      language: 'css',
      description: 'Flexbox Layout',
      code: `.container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.3s ease-in-out;
}`
  }
];






