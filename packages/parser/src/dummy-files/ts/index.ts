// IMPORTS
import { login } from "./auth.js";
import { testFn } from "./someFolder/test.js";
import utilities from "./utils.js";

// FUNCTION
export function run() {
  // ARROW FUNCTION
  const test = () => {
    console.log("xxx");
    return 2;
  };

  function xyz() {
    console.log("hello world");
  }

  // IMPORTED FUNCTIONS
  utilities.utilOne();
  utilities.utilTwo();

  // VARIABLE
  const res = test();
  console.log(res);

  // MORE IMPORTED FUNCTIONS
  utilities.utilThree();
  testFn();
  login();
}

// EXPORTED CLASS
export class PublicUserService {
  // PROPERTY
  private someProp: string;

  // CTOR
  constructor(
    private userModel: string,
    someProp: string,
  ) {
    this.someProp = someProp;
  }

  // METHODS
  static getUser() {
    console.log("random user");
  }

  private getRole() {
    return "student";
  }

  public getSession() {
    return this.getRole();
  }
}

// TYPE
type UserAge = number;

// ENUM
enum UserRole {
  Student,
  Manager,
  Admin,
}

// INTERFACE
interface IPrivateUserService {
  getSession(): string;
}

// NON-EXPORTED CLASS
class PrivateUserService implements IPrivateUserService {
  // PROPERTY
  private someProp: string;
  private age: UserAge = 2;

  // CTOR
  constructor(
    private userModel: string,
    someProp: string,
  ) {
    this.someProp = someProp;
  }

  // METHODS
  static getUser() {
    console.log("random user");
  }

  private getRole(): UserRole {
    return UserRole.Student;
  }

  public getSession() {
    return `The user's role is ${this.getRole()}`;
  }
}

// TOP-LEVEL CODE
console.log("hello world :D");
const randomArrayOfNumbers = [1, 2, 3].map((n) => n * 2);
((x) => x * 2)(1);

// CALLBACK SHOULD BE IGNORED
// @ts-ignore
express.route("/get", (req, res) => {
  res.send("hello world");
});

// CALLBACK SHOULD BE IGNORED
// @ts-ignore
const value = express.route("/get", (req, res) => {
  res.send("hello world");
});

// SHOULD NOT BE IGNORED
const x = function (x: number, y: number) {
  return x + y;
};

const y = () => {
  function xyz() {
    console.log("hello world");

    function xyz2() {
      console.log("hello world");
    }
  }
};

const abc = 54,
  web = {
    x() {
      console.log("123");
    },
  },
  j = 2;

console.log(PrivateUserService.getUser());

const userModel = new PrivateUserService("my-model", "my-prop");

userModel.getSession();

export const helloWorld = "hello!";
