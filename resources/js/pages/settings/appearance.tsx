import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import PublicLayout from '@/layouts/public-layout';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    return (
        <PublicLayout showCategories={false} showChips={false} showSearch={false}>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance Settings</h1>

            <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
                <SettingsLayout>
                    <div className="space-y-6">
                        <Heading
                            variant="small"
                            title="Appearance settings"
                            description="Update your account's appearance settings"
                        />
                        <AppearanceTabs />
                    </div>
                </SettingsLayout>
            </main>
        </PublicLayout>
    );
}
