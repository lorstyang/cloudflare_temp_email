import { Context } from "hono";
import { handleMailListQuery } from "../common";

export default {
    getMails: async (c: Context<HonoCustomType>) => {
        const { address, limit, offset, sender } = c.req.query();
        const addressQuery = address ? `address = ?` : "";
        const addressParams = address ? [address] : [];
        const senderQuery = sender ? `source LIKE ?` : "";
        const senderParams = sender ? [`%${sender}%`] : [];
        const authCodeQuery = `metadata IS NOT NULL AND json_extract(metadata, '$.type') = 'auth_code'`;
        const filterQuerys = [addressQuery, senderQuery, authCodeQuery].filter((item) => item).join(" and ");
        const finalQuery = filterQuerys.length > 0 ? `where ${filterQuerys}` : "";
        const filterParams = [...addressParams, ...senderParams];
        const finalLimit = limit ? parseInt(limit) : 10;
        return await handleMailListQuery(c,
            `SELECT * FROM raw_mails ${finalQuery}`,
            `SELECT count(*) as count FROM raw_mails ${finalQuery}`,
            filterParams, finalLimit, offset
        );
    },
    getUnknowMails: async (c: Context<HonoCustomType>) => {
        const { limit, offset } = c.req.query();
        return await handleMailListQuery(c,
            `SELECT * FROM raw_mails where address NOT IN (select name from address) `,
            `SELECT count(*) as count FROM raw_mails`
            + ` where address NOT IN (select name from address) `,
            [], limit, offset
        );
    },
    deleteMail: async (c: Context<HonoCustomType>) => {
        const { id } = c.req.param();
        const { success } = await c.env.DB.prepare(
            `DELETE FROM raw_mails WHERE id = ? `
        ).bind(id).run();
        return c.json({
            success: success
        })
    }
}
