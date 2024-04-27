import { EmailMessage } from "cloudflare:email";
import { createMimeMessage, Mailbox } from 'mimetext';
import PostalMime from 'postal-mime';


export default {
	async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
		if (message.from !== env.EXPECTED_FROM_EMAIL) {
			await message.forward(env.TO_EMAIL);
			return;
		}

		const parser = new PostalMime();
		const email = await parser.parse(message.raw);
		
		if (!email.attachments.length) {
			await message.forward(env.TO_EMAIL);
			return;
		}

		const newMessage = createMimeMessage();
		newMessage.setSender({ name: 'Auto-transcriber', addr: env.FROM_EMAIL });
		newMessage.setRecipient(env.TO_EMAIL);
		newMessage.setSubject(email.subject ?? "");
		newMessage.setHeader('Reply-To', new Mailbox(message.from));

		const transcriptions: string[] = [];
		let addedPlain = '\nTranscription of attachments below:';
		let addedHtml = '<p>Transcription of attachments below:</p>';
		for (const attachment of email.attachments) {
			const blob = attachment.content;
			const input = {audio: [...new Uint8Array(blob)]};
			const response = await env.AI.run('@cf/openai/whisper', input);
			transcriptions.push(response.text);
			addedPlain += `\n- ${attachment.filename}:\n    ${response.text}`;
			addedHtml += `<p><b>${attachment.filename}</b><br />${response.text}`;
		}

		if (email.html) {
			newMessage.addMessage({
				contentType: 'text/html',
				data: email.html + addedHtml,
			})
		}
		if (email.text) {
			newMessage.addMessage({
				contentType: 'text/plain',
				data: email.text + addedPlain,
			})
		}
		
		const cfNewMessage = new EmailMessage(
			env.FROM_EMAIL,
			env.TO_EMAIL,
			newMessage.asRaw(),
		);

		await env.SEB.send(cfNewMessage);
	},
};
