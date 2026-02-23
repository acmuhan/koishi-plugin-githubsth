declare const _default: {
    commands: {
        githubsth: {
            description: string;
        };
        'githubsth.repo': {
            description: string;
            messages: {
                repo_info: string;
                error: string;
                specify_repo: string;
                not_found: string;
            };
        };
        'githubsth.subscribe': {
            description: string;
            messages: {
                specify_repo: string;
                invalid_repo: string;
                run_in_channel: string;
                repo_not_trusted: string;
                invalid_events: string;
                updated: string;
                created: string;
                failed: string;
            };
        };
        'githubsth.unsubscribe': {
            description: string;
            messages: {
                specify_repo: string;
                run_in_channel: string;
                not_found: string;
                success: string;
            };
        };
        'githubsth.list': {
            description: string;
            messages: {
                run_in_channel: string;
                empty: string;
                item: string;
            };
        };
        'githubsth.render': {
            description: string;
            messages: {
                invalid_mode: string;
                mode_set: string;
                invalid_theme: string;
                theme_set: string;
                invalid_style: string;
                style_set: string;
                invalid_width: string;
                width_set: string;
                digest_usage: string;
                digest_set: string;
                invalid_seconds: string;
                digest_window_set: string;
                invalid_count: string;
                digest_max_set: string;
                themes_list: string;
                styles_list: string;
                status_text: string;
                unknown_event: string;
                unknown_theme: string;
                unknown_style: string;
                preview_failed: string;
                repo_required: string;
                no_sub_in_channel: string;
                repo_theme_set: string;
                repo_theme_cleared: string;
                repo_style_set: string;
                repo_style_cleared: string;
                no_matched_subs: string;
                repo_style_item: string;
            };
        };
        'githubsth.trust': {
            description: string;
        };
    };
};
export default _default;
