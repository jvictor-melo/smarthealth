import { customType } from "drizzle-orm/pg-core";

export type Ponto = { lat: number; lng: number };

/**
 * geography(Point, 4326) do PostGIS.
 * Escreve como EWKT e lê o hex EWKB que o Postgres devolve por padrão.
 */
export const geographyPoint = customType<{ data: Ponto; driverData: string }>({
    dataType() {
        return "geography(Point, 4326)";
    },
    toDriver({ lat, lng }) {
        return `SRID=4326;POINT(${lng} ${lat})`;
    },
    fromDriver(value) {
        return parseEwkbPoint(value);
    },
});

/** Decodifica um ponto EWKB em hex (com ou sem SRID). */
export function parseEwkbPoint(hex: string): Ponto {
    const buffer = Buffer.from(hex, "hex");
    const littleEndian = buffer.readUInt8(0) === 1;
    const readUInt32 = (offset: number) => (littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset));
    const readDouble = (offset: number) => (littleEndian ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset));

    const type = readUInt32(1);
    const hasSrid = (type & 0x20000000) !== 0;
    const offset = hasSrid ? 9 : 5;

    return { lng: readDouble(offset), lat: readDouble(offset + 8) };
}
