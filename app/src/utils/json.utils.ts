export const parseJson = (data: any): any => {
    if (!data) return null;
    try {
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        return data;
    }
};
