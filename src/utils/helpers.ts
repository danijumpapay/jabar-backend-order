
export const generateId = (name?: string): string => {
    const personName: string[] = (name || "Anonymous").split(" ");
    const prefixCode: string = personName[0].substring(0, 1).toUpperCase() + (personName[1] ? personName[1].substring(0, 1).toUpperCase() : "");
    const dateNow = new Date();
    const h: number = dateNow.getHours();
    const i: number = dateNow.getMinutes();
    const s: number = dateNow.getSeconds();
    const y: number = dateNow.getFullYear();
    const m: number = dateNow.getMonth() + 1;
    const d: number = dateNow.getDate();
    const rn: number[] = [...Array(4)].map(() => Math.floor(Math.random() * 10));
    const uniqId: string = prefixCode + s + d + h + m + i + y + rn[0] + rn[1] + rn[2] + rn[3];

    return uniqId;
};

export const initialName = (name: string): string => {
    const names: string[] = name.split(/[\s_\-]+/);
    return names
        .filter(Boolean)
        .map(word => word[0])
        .filter(ch => /^[A-Za-z]$/.test(ch))
        .join("")
        .toUpperCase();
};

export const extractPlate = (plate: string) => {
    if (!plate) return null;
    const normalized = plate.replace(/\s+/g, "");
    const regex = /^([A-Z]+)(\d+)([A-Z]*)$/i;
    const match = normalized.match(regex);
    if (!match) return null;
    return {
        prefix: match[1].toUpperCase(),
        number: match[2],
        serial: match[3].toUpperCase(),
    };
};

export const useFormula = (
    params: { [key: string]: any },
    formula: string
): () => number => {
    const ignoredKeywords = new Set(["Math", "Object", "Array", "Date", "true", "false", "null", "undefined"]);
    const allPotentialVars = [...new Set(formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [])];
    const requiredVars = allPotentialVars.filter(v => !ignoredKeywords.has(v));

    if (requiredVars.length === 0) {
        const staticFunction = new Function(`return ${formula}`);
        return () => staticFunction();
    }

    const paramNames = requiredVars;
    const paramValues = requiredVars.map(varName => {
        return params.hasOwnProperty(varName) ? params[varName] : 0;
    });

    const dynamicFunction = new Function(...paramNames, `return ${formula}`);
    return () => dynamicFunction(...paramValues);
};

export const parseIDNumber = (value: string): number => {
    if (!value) return 0;
    return Number(value.replace(/\./g, ""));
};

export const calculateDueDateInMonths = (dueDateString: string): number => {
    if (!dueDateString) return 0;
    const parts = dueDateString.split("-");
    let dueDate: Date;
    if (parts.length === 3 && parts[2].length === 4) {
        dueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
        dueDate = new Date(dueDateString);
    }
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (today.getTime() <= dueDate.getTime()) {
        return 0;
    }

    const monthDifference =
        (today.getFullYear() - dueDate.getFullYear()) * 12 +
        (today.getMonth() - dueDate.getMonth());

    if (today.getDate() > dueDate.getDate()) {
        return monthDifference + 1;
    }

    return monthDifference === 0 ? 1 : monthDifference;
};

export const calculateDueDateInDays = (dueDateString: string): number => {
    if (!dueDateString) return 0;
    const parts = dueDateString.split("-");
    let dueDate: Date;
    if (parts.length === 3 && parts[2].length === 4) {
        dueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
        dueDate = new Date(dueDateString);
    }
    const today = new Date();

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (today.getTime() <= dueDate.getTime()) {
        return 0;
    }

    const milisecondsDifference = today.getTime() - dueDate.getTime();

    const dayInMiliseconds = 1000 * 60 * 60 * 24;
    const daysDifference = Math.floor(milisecondsDifference / dayInMiliseconds);

    return daysDifference;
};

export const convertMonthToYM = (months: number): { year: number; month: number } => {
    if (months < 0) {
        months = 0;
    }
    const year = Math.floor(months / 12);
    const month = months % 12;
    return { year, month };
};

export const getVehicleTypeId = (swdValue: number): number => {
    if (swdValue === 35000 || swdValue === 83000) {
        return 2;
    } else if (swdValue === 143000) {
        return 1;
    } else {
        return 3;
    }
};

export const getVehicleType = (swdValue: number): string => {
    if (swdValue === 35000 || swdValue === 83000) {
        return "MOTOR";
    } else if (swdValue === 143000) {
        return "MOBIL";
    } else {
        return "TRUK";
    }
};

export const extractYMD_HI = (dateInput: Date | string): string => {
    const dateObj = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const get25HoursFromNow = (): string => {
    const dateObj = new Date();
    dateObj.setHours(dateObj.getHours() + 25);
    return dateObj.toISOString();
};

export const hardcodedTestingNumbers: string[] = [
    "6281546416749",
    "6287885713222",
    "6281905170408",
    "6281388044805",
    "6289646615025",
    "6287802337554",
    "6285694887705",
    "6281378781338",
    "6282115516798",
    "6288222099475",
    "60199943898",
    "81378781338",
    "081378781338",
];
