type AddressContact = {
    address?: string | null;
    address_html?: string | null;
};

export function FooterAddress({ contact }: { contact?: AddressContact | null }) {
    const className = 'mt-3 text-sm text-slate-600 break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold';

    // Only the server-sanitized representation may enter the HTML sink.
    if (contact?.address_html != null) {
        return <div className={className} dangerouslySetInnerHTML={{ __html: contact.address_html }} />;
    }

    const text = contact?.address ?? 'Neo Soho Capital 40th Floor\nJl. Tanjung Duren Raya No 1\nJakarta Barat, DKI Jakarta 11470';
    return <div className={`${className} whitespace-pre-line`}>{text.replaceAll('\\n', '\n')}</div>;
}
