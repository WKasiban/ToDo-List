export const uid = () => {
    return Math.floor(new Date().valueOf() * Math.random()).toString();
};